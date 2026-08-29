// Document and DocumentImageMap Mongoose schemas with createdBy and updatedBy
const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: true,
      trim: true,
      match: [/\.[a-zA-Z0-9]+$/, 'File name must include a valid extension'],
    },
    documentInfo: {
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

const DocumentImageMapSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true,
    },
    imagePath: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      lowercase: true,
      enum: ['png', 'jpeg', 'jpg', 'webp', 'tiff', 'svg'],
    },
    pageNo: {
      type: Number,
      required: true,
      min: 1,
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
    timestamps: { createdAt: 'creationTime', updatedAt: false },
    versionKey: false,
  }
);

// Compound unique index on documentId + pageNo
DocumentImageMapSchema.index({ documentId: 1, pageNo: 1 }, { unique: true });

module.exports = {
  Document: mongoose.model('Document', DocumentSchema),
  DocumentImageMap: mongoose.model('DocumentImageMap', DocumentImageMapSchema),
};