// 云函数：feedback — 收集用户反馈
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const openid = cloud.getWXContext().OPENID
  const { type, content } = event // type: 'correction' | 'suggestion' | 'bug'

  await db.collection('feedback').add({
    data: {
      userId: openid,
      type,
      content,
      createdAt: new Date(),
    },
  })

  return { success: true }
}
