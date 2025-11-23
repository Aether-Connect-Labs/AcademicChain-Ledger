const buckets = new Map()

function rateLimit({ windowMs, max }) {
  return async function (req, res) {
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0] || req.socket.remoteAddress || 'unknown'
    const now = Date.now()
    const bucket = buckets.get(ip) || { count: 0, reset: now + windowMs }
    if (now > bucket.reset) {
      bucket.count = 0
      bucket.reset = now + windowMs
    }
    bucket.count += 1
    buckets.set(ip, bucket)
    if (bucket.count > max) {
      res.status(429).json({ error: 'Too many requests' })
      throw new Error('rate_limited')
    }
  }
}

module.exports = { rateLimit }