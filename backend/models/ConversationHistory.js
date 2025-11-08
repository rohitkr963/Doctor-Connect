const mongoose = require('mongoose');

const conversationHistorySchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  sessionId: { 
    type: String, 
    required: true 
  },
  messages: [{
    role: { 
      type: String, 
      enum: ['user', 'bot', 'model'],
      required: true 
    },
    text: { 
      type: String, 
      required: true 
    },
    timestamp: { 
      type: Date, 
      default: Date.now 
    },
    intent: { 
      type: String 
    },
    metadata: {
      type: Object,
      default: {}
    }
  }],
  context: {
    lastIntent: String,
    extractedInfo: Object,
    preferredLanguage: { type: String, default: 'hi' }
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

// Index for faster queries
conversationHistorySchema.index({ userId: 1, sessionId: 1 });
conversationHistorySchema.index({ createdAt: 1 });

module.exports = mongoose.models.ConversationHistory || mongoose.model('ConversationHistory', conversationHistorySchema);
