import mongoose from 'mongoose';

const visitSchema = new mongoose.Schema({
    userId: {
        type: String, // Changed from ObjectId to String to support "anonymous"
        required: true
    },
    visitCount: {
        type: Number,
        default: 0
    },
    lastVisit: {
        type: Date,
        default: Date.now
    },
    sessions: [{
        sessionId: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Index for faster queries
visitSchema.index({ userId: 1 });

export const Visit = mongoose.model('Visit', visitSchema);