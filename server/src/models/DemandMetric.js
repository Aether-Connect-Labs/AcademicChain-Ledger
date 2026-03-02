
const mongoose = require('mongoose');

const DemandMetricSchema = new mongoose.Schema({
    keyword: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    count: {
        type: Number,
        default: 1
    },
    lastSearched: {
        type: Date,
        default: Date.now
    },
    // Optional: breakdown by week/month for "professional" analytics
    history: [{
        date: { type: Date, default: Date.now },
        employerId: { type: String } // Optional: who searched
    }]
});

module.exports = mongoose.model('DemandMetric', DemandMetricSchema);
