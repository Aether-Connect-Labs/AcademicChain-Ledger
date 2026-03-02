const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config(); // Load env vars immediately

console.log("SERVER STARTING - V2 RELOADED - CHECKING FILE INTEGRITY");
const { connectDB, connectRedis } = require("./src/config/database");
const apiRoutes = require("./src/routes/api");

// Conectar a Base de Datos y Caché
connectDB();
connectRedis();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Logging de peticiones
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Rutas API
app.use("/api", apiRoutes);

// Health check
app.get("/", (req, res) => {
    res.json({
        service: "AcademicChain-Ledger Backend",
        status: "Online",
        version: "1.0.0",
        network: "Hedera Testnet (Arkhia Mirror Nodes)"
    });
});

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error("Error no manejado:", err.stack);
    res.status(500).json({
        success: false,
        message: "Algo salió mal en el servidor",
        error: process.env.NODE_ENV === "development" ? err.message : undefined
    });
});

app.listen(PORT, () => {
    console.log(`Servidor AcademicChain-Ledger corriendo en: http://localhost:${PORT}`);
});
