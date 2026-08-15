// 云函数：syncData — 批量执行客户端离线队列操作 + 返回增量变更
// 文档 _id 统一为 {openid}_{业务key}，避免多用户冲突；删除用墓碑标记（deleted: true）传播
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { ops = [], lastSyncAt } = event
  const openid = cloud.getWXContext().OPENID

  // 1. 批量 upsert（同 _id 重复操作已被客户端压缩，此处逐条执行即可保证幂等）
  for (const op of ops) {
    if (op.action !== 'write') continue
    const coll = db.collection(op.collection)
    const { _id: key, ...data } = op.data
    const docId = `${openid}_${key}`
    await coll
      .doc(docId)
      .set({
        data: { ...data, key, userId: openid, updatedAt: new Date() },
      })
      .catch(() =>
        coll.add({
          data: { _id: docId, ...data, key, userId: openid, createdAt: new Date(), updatedAt: new Date() },
        })
      )
  }

  // 2. 返回上次同步后的云端增量变更（含墓碑，客户端据此传播删除）
  const collections = ['favorites', 'notes', 'progress', 'quiz_records', 'daily_challenges']
  const remoteChanges = {}
  for (const name of collections) {
    const res = await db
      .collection(name)
      .where({ userId: openid, updatedAt: _.gt(new Date(lastSyncAt)) })
      .limit(200)
      .get()
    if (res.data.length > 0) remoteChanges[name] = res.data
  }

  return { serverTime: new Date().toISOString(), remoteChanges }
}
