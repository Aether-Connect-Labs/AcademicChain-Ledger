const Student = require('../models/Student');
const { redisClient } = require('../config/database');
const axios = require('axios');

// Helper to check Arkhia/Hedera status
async function checkNetworkStatus() {
    try {
        // Simple check or cached status
        // In a real app, we might check a health endpoint of our Hedera service
        return "Operational"; 
    } catch (e) {
        return "Degraded";
    }
}

exports.getInstitutionReputation = async (req, res) => {
    const { id: institutionId } = req.params;
    
    if (!institutionId) {
        return res.status(400).json({ success: false, message: "Institution ID is required" });
    }

    const cacheKey = `reputation:${institutionId}`;

    try {
        // 1. Check Redis Cache
        if (redisClient.isOpen) {
            const cachedData = await redisClient.get(cacheKey);
            if (cachedData) {
                console.log(`[Cache] Hit for reputation:${institutionId}`);
                return res.json(JSON.parse(cachedData));
            }
        }

        // 2. Calculate Metrics from MongoDB
        // Find all students who have at least one certificate from this institution
        const students = await Student.find({ 
            "certificates.institutionId": institutionId 
        });

        let totalCertificates = 0;
        let employedGraduates = 0;
        const totalGraduates = students.length;

        students.forEach(student => {
            // Count certificates from this institution
            const instCerts = student.certificates.filter(c => c.institutionId === institutionId);
            totalCertificates += instCerts.length;

            // Check if student is employed
            if (student.hiringHistory && student.hiringHistory.length > 0) {
                employedGraduates++;
            }
        });

        const employabilityRate = totalGraduates > 0 
            ? ((employedGraduates / totalGraduates) * 100).toFixed(1) 
            : 0;

        // 3. Get Network Status
        const networkStatus = await checkNetworkStatus();

        const reputationData = {
            success: true,
            institutionId,
            metrics: {
                totalCertificates,
                totalGraduates,
                employabilityRate: parseFloat(employabilityRate),
                networkStatus, // "Operational"
                publicFaithCount: totalCertificates, // Same as total certs for now
                topicId: process.env.HCS_TOPIC_ID || "0.0.4576394"
            },
            lastUpdated: new Date()
        };

        // 4. Save to Redis (TTL: 5 minutes = 300 seconds)
        if (redisClient.isOpen) {
            await redisClient.set(cacheKey, JSON.stringify(reputationData), {
                EX: 300
            });
        }

        res.json(reputationData);

    } catch (error) {
        console.error("Reputation API Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};
