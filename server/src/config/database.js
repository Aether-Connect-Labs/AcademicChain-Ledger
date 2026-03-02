const mongoose = require('mongoose');
const { createClient } = require('redis');

// MongoDB Connection
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            dbName: process.env.DB_NAME || 'academicchain',
        });

        console.log(`[MongoDB] Conectado: ${conn.connection.host}`);
    } catch (error) {
        console.error(`[MongoDB] Error de conexión: ${error.message}`);
        // No salir del proceso para permitir que el servidor funcione con funcionalidad limitada si la BD falla
        // process.exit(1); 
    }
};

// Redis Connection
const redisClient = createClient({
    url: process.env.REDIS_URL
});

redisClient.on('error', (err) => console.log('[Redis] Client Error', err));
redisClient.on('connect', () => console.log('[Redis] Conectado exitosamente'));

const connectRedis = async () => {
    try {
        await redisClient.connect();
    } catch (error) {
        console.error(`[Redis] Error de conexión: ${error.message}`);
    }
};

module.exports = { connectDB, connectRedis, redisClient };
