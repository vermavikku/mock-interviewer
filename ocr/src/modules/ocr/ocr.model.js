// OCR Mongoose Schema with createdBy and updatedBy
const mongoose = require('mongoose');

const OcrItemSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    extension: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    extractedText: {
      type: String,
      default: '',
    },
    confidence: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['completed', 'failed'],
      default: 'completed',
    },
    error: {
      type: String,
      default: null,
    },
    createdBy: {
      type: String,
      default: null,
      index: true,
    },
    updatedBy: {
      type: String,
      default: null,
    },
  },
  {
    _id: true,
    timestamps: { createdAt: 'processedAt', updatedAt: false },
  }
);

const OcrBatchSchema = new mongoose.Schema(
  {
    batchName: {
      type: String,
      trim: true,
      default: () => `Batch_${new Date().toISOString().replace(/[:.]/g, '-')}`,
    },
    totalImages: {
      type: Number,
      required: true,
      min: 1,
    },
    successfulImages: {
      type: Number,
      default: 0,
    },
    failedImages: {
      type: Number,
      default: 0,
    },
    items: [OcrItemSchema],
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdBy: {
      type: String,
      default: null,
      index: true,
    },
    updatedBy: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: { createdAt: 'createdDate', updatedAt: 'updatedDate' },
    versionKey: false,
  }
);

module.exports = {
  OcrBatch: mongoose.model('OcrBatch', OcrBatchSchema),
};
