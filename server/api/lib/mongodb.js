const { MongoClient } = require('mongodb')

let cachedClient = null
let cachedDb = null

async function connectToDatabase() {
  if (cachedDb) return { db: cachedDb }
  const uri = process.env.MONGODB_URI
  const dbName = process.env.MONGODB_DB || 'academicchain'
  const client = new MongoClient(uri)
  await client.connect()
  const db = client.db(dbName)
  cachedClient = client
  cachedDb = db
  return { db }
}

module.exports = { connectToDatabase }