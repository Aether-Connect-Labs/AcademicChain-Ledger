const { Client } = require("@hashgraph/sdk");

// Configura tus llaves en el archivo .env
const operatorId = process.env.HEDERA_OPERATOR_ID;
const operatorKey = process.env.HEDERA_OPERATOR_KEY;
const arkhiaKey = process.env.ARKHIA_API_KEY;

// 1. Inicializar cliente
// Nota: Usamos forTestnet() por defecto, cambiar a forMainnet() para producción
const client = Client.forTestnet();
if (operatorId && operatorKey) {
    client.setOperator(operatorId, operatorKey);
}

// 2. CONEXIÓN A ARKHIA (Esto es lo que da robustez)
if (arkhiaKey) {
    client.setMirrorNetwork(`hedera-mirror.arkhia.io:443?x-api-key=${arkhiaKey}`);
    console.log("Infraestructura conectada a los nodos espejo de Arkhia");
} else {
    console.warn("Advertencia: No se encontró ARKHIA_API_KEY, usando red pública por defecto");
}

module.exports = { client };
