// 云函数：login — 获取 openid + 创建/查询用户
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  // 查询用户是否存在
  const exist = await db.collection('users').doc(openid).get().catch(() => null)

  if (!exist || !exist.data) {
    // 新用户 → 创建记录
    await db.collection('users').add({
      data: {
        _id: openid,
        settings: { theme: 'auto', fontSize: 'medium' },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
  }

  return { openid, isNew: !exist?.data, createdAt: exist?.data?.createdAt || new Date() }
}
