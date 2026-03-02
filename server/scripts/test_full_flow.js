
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function runTest() {
    console.log("🚀 Starting Full Flow Test...");

    const studentId = `STU-${Date.now()}`;
    const studentName = "Juan Perez Dev";
    const courseName = "Full Stack React Developer";
    const institutionId = "INST-001";

    // 1. Certification Request
    console.log("\n1️⃣  Testing Certification Request...");
    try {
        const res = await axios.post(`${BASE_URL}/certify`, {
            studentName,
            studentId,
            courseName,
            institutionId,
            institutionName: "Tech Academy",
            planType: "premium"
        });
        console.log("✅ Certification Initiated:", res.data);
    } catch (e) {
        console.error("❌ Certification Failed:", e.response ? e.response.data : e.message);
        return;
    }

    // Wait for DB to update (simulating async processing if any)
    await new Promise(r => setTimeout(r, 2000));

    // 2. Employer Search
    console.log("\n2️⃣  Testing Employer Search (Query: 'React')...");
    try {
        const res = await axios.get(`${BASE_URL}/talent/search?query=React`);
        console.log("✅ Search Results:", JSON.stringify(res.data, null, 2));
        
        if (res.data.results.length === 0) {
            console.warn("⚠️ No students found. Check DB persistence.");
        }
    } catch (e) {
        console.error("❌ Search Failed:", e.message);
    }

    // 3. Hire Student
    console.log("\n3️⃣  Testing Hiring Action...");
    try {
        const res = await axios.post(`${BASE_URL}/talent/hire`, {
            studentId,
            employerName: "Google",
            role: "Senior React Developer"
        });
        console.log("✅ Hiring Recorded:", res.data);
    } catch (e) {
        console.error("❌ Hiring Failed:", e.message);
    }

    // 4. Market Demand Metrics
    console.log("\n4️⃣  Testing Market Demand Metrics...");
    try {
        const res = await axios.get(`${BASE_URL}/market/demand`);
        console.log("✅ Market Metrics:", JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error("❌ Metrics Failed:", e.message);
    }

    console.log("\n🏁 Test Complete.");
}

runTest();
