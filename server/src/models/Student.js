const mongoose = require('mongoose');

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
    courseName: {
        type: String,
        required: true
    },
    institutionId: {
        type: String,
        required: true
    },
    graduationDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['processing', 'completed', 'failed'],
        default: 'processing'
    },
    hcsTransactionId: {
        type: String
    },
    ipfsHash: {
        type: String
    },
    pdfUrl: {
        type: String
    },
    requestTimestamp: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
StudentSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Student', StudentSchema);
