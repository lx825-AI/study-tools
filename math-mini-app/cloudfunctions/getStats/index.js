// 云函数：getStats — 聚合用户学习统计
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const openid = cloud.getWXContext().OPENID

  const [favCount, progressRes, quizRes] = await Promise.all([
    // 收藏数排除墓碑（deleted: true）
    db.collection('favorites').where({ userId: openid, deleted: _.neq(true) }).count(),
    db.collection('progress').where({ userId: openid }).get(),
    db.collection('quiz_records').where({ userId: openid }).orderBy('updatedAt', 'desc').limit(20).get(),
  ])

  // 总进度百分比（按 章节:索引 去重，避免跨章节索引冲突）
  const totalFormulas = 177
  const viewedSet = new Set()
  progressRes.data.forEach((p) =>
    (p.viewedFormulas || []).forEach((i) => viewedSet.add(`${p.sectionId}:${i}`))
  )
  const progressPercent = Math.round((viewedSet.size / totalFormulas) * 100)

  // 正确率趋势（按时间正序返回）
  const scores = quizRes.data
    .reverse()
    .map((r) => Math.round((r.correctAnswers / r.totalQuestions) * 100))

  return { favCount: favCount.total, progressPercent, scores }
}
