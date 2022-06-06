const version = require('../../../package.json').version
const date = new Date()
const env = process.env.NODE_ENV ? process.env.NODE_ENV : 'development'
const isProd = env === 'production'

module.exports = {
  analytics: 'C8XZPHRS2H',
  base: 'https://peterschmalfeldt.com',
  assetPath: '/assets/',
  cacheBreak: isProd ? '' : `?ac${new Date().getTime()}`,
  currentYear: date.getFullYear(),
  currentDate: date.toISOString().slice(0, 10),
  publishedDate: date.toISOString(),
  env: env,
  robots: isProd ? 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' : 'noindex,nofollow',
  version: version
}
