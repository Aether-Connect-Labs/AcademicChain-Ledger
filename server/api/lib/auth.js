const jwt = require('jsonwebtoken')

async function validateRequest(req) {
  let token = null
  const auth = req.headers['authorization']
  if (auth && auth.startsWith('Bearer ')) token = auth.slice(7)
  if (!token && req.cookies && req.cookies.token) token = req.cookies.token
  if (!token) return null
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    return { id: decoded.userId }
  } catch {
    return null
  }
}

module.exports = { validateRequest }