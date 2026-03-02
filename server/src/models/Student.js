const mongoose = require('mongoose');

const CertificateSchema = new mongoose.Schema({
    certificateName: { type: String, required: true },
    courseName: { type: String }, // Optional, can be same as certificateName
    graduationDate: { type: Date },
    institutionId: { type: String, required: true },
    institutionName: { type: String }, // For easier display
    
    // Blockchain Anchors
    xrpHash: { type: String },
    algoHash: { type: String },
    hederaTransactionId: { type: String, required: true },
    
    // Content & Storage
    ipfsCid: { type: String, required: true },
    pdfUrl: { type: String }, // Optional direct URL if available
    
    // Digital Identity
    sha256Hash: { type: String, required: true, unique: true }, // The unique fingerprint
    
    issueDate: { type: Date, default: Date.now },
    status: { 
        type: String, 
        enum: ['processing', 'completed', 'revoked'], 
        default: 'processing' 
    }
});

const StudentSchema = new mongoose.Schema({
    studentId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    studentName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    linkedinProfile: {
        type: String,
        trim: true
    },
    
    // Wallet of Certificates
    certificates: [CertificateSchema],
    
    // Employment History (Feedback Loop)
    hiringHistory: [{
        employerName: { type: String },
        role: { type: String },
        hiredDate: { type: Date, default: Date.now },
        verified: { type: Boolean, default: false }
    }],
    
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Remove pre-save hook to avoid potential middleware issues
// StudentSchema.pre('save', function(next) {
//    this.updatedAt = Date.now();
//    next();
// });

module.exports = mongoose.model('Student', StudentSchema);
