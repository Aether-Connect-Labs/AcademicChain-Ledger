const { Client, PrivateKey } = require("@hashgraph/sdk");
const dotenv = require("dotenv");

dotenv.config();

// Configuración de Arkhia para Testnet
const arkhiaUrl = `https://hedera.testnet.arkhia.io/api/v1/${process.env.ARKHIA_API_KEY}`;

const client = Client.forTestnet();

// Inyectamos el endpoint de Arkhia para que las consultas pasen por sus nodos premium
if (process.env.ARKHIA_API_KEY) {
    console.log("[Hedera] Configuring Arkhia Mirror Node...");
    client.setMirrorNetwork(["testnet.mirrornode.arkhia.io:443"]);
}

const operatorId = process.env.HEDERA_OPERATOR_ID;
const operatorKey = process.env.HEDERA_OPERATOR_KEY;

if (operatorId && operatorKey) {
    try {
        let key;
        const cleanKey = operatorKey.startsWith("0x") ? operatorKey.substring(2) : operatorKey;

        // Try ED25519 First (Most common on Hedera)
        try {
            console.log("[Hedera] Attempting ED25519 parsing...");
            key = PrivateKey.fromStringED25519(cleanKey);
        } catch (e) {
            console.warn("[Hedera] Failed to parse as ED25519, trying ECDSA...", e.message);
            // Try ECDSA
            try {
                key = PrivateKey.fromStringECDSA(cleanKey);
            } catch (e2) {
                console.warn("[Hedera] Failed to parse as ECDSA, trying generic fromString...", e2.message);
                // Last resort
                key = PrivateKey.fromString(operatorKey);
            }
        }
        
        client.setOperator(operatorId, key);
        
        // Determine key type for logging
        const keyType = key.toString().startsWith("302e020100300506032b6570") ? "ED25519" : "ECDSA (likely)";
        console.log(`[Hedera] Operator set: ${operatorId} (Key type: ${keyType})`);
        
    } catch (error) {
        console.error("Error setting Hedera operator:", error.message);
    }
}

module.exports = { client, arkhiaUrl };
