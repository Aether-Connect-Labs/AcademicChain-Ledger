
const Student = require("../models/Student");
const DemandMetric = require("../models/DemandMetric");

// 1. Search Talent
exports.searchTalent = async (req, res) => {
    try {
        const { query, employerId } = req.query; // e.g. "React Developer" or "Full Stack"
        
        if (!query) {
            return res.status(400).json({ success: false, message: "Search query required" });
        }

        console.log(`[Employer] Searching for: ${query}`);

        // Track Demand Metric (Async - don't block response)
        // "cada busqueda que hacen los empleadores las instituciones ven con metrica"
        trackDemand(query, employerId).catch(err => console.error("Error tracking demand:", err));

        // Find students with matching certificate names or course names
        // Only return public profile info: Name, LinkedIn, Certificates
        const students = await Student.find({
            "certificates.certificateName": { $regex: query, $options: "i" }
        }).select("studentName linkedinProfile certificates.certificateName certificates.sha256Hash certificates.hederaTransactionId");

        // Format for Employer View
        // "empleador solo se ver la persona a lado su linkeding y el nombre de la persona y los titulos o certificados nada mas"
        const formattedResults = students.map(s => ({
            name: s.studentName,
            linkedin: s.linkedinProfile || "Not provided",
            certificates: s.certificates.map(c => ({
                title: c.certificateName,
                id: c.sha256Hash, // The unique identity
                hederaId: c.hederaTransactionId // For verification if needed
            }))
        }));

        res.json({
            success: true,
            count: formattedResults.length,
            results: formattedResults
        });

    } catch (error) {
        console.error("Search Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// 2. Hire Student (Feedback Loop)
exports.hireStudent = async (req, res) => {
    try {
        const { studentId, employerName, role } = req.body;

        if (!studentId || !employerName || !role) {
            return res.status(400).json({ success: false, message: "Missing hiring details" });
        }

        // "si una persona es contratada por el empleador esto envia a la institucion que su alumno lo contrato"
        // Update Student History
        const student = await Student.findOne({ studentId });
        
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }

        student.hiringHistory.push({
            employerName,
            role,
            hiredDate: new Date(),
            verified: true // Assume verified if coming from authenticated employer portal
        });

        await student.save();

        // Notify Institution (Mock Notification)
        // In a real system, we would emit a socket event or email to the institutionId owner
        // For now, we log it as a success metric
        console.log(`[Notification] To Institution(s): Student ${student.studentName} was hired by ${employerName} as ${role}!`);

        res.json({
            success: true,
            message: "Hiring recorded and institution notified",
            student: student.studentName
        });

    } catch (error) {
        console.error("Hiring Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// 3. Get Market Demand Metrics (For Institutions)
exports.getMarketDemand = async (req, res) => {
    try {
        // Return top searched keywords
        const metrics = await DemandMetric.find().sort({ count: -1 }).limit(10);
        
        res.json({
            success: true,
            data: metrics.map(m => ({
                skill: m.keyword,
                searches: m.count,
                trend: "up" // Mock trend analysis
            }))
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Helper: Track Demand
async function trackDemand(query, employerId) {
    // Clean query to base keyword
    const keyword = query.trim().toLowerCase();
    
    await DemandMetric.findOneAndUpdate(
        { keyword },
        { 
            $inc: { count: 1 },
            $set: { lastSearched: new Date() },
            $push: { history: { date: new Date(), employerId } }
        },
        { upsert: true }
    );
}
