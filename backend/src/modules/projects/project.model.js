const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Project title is required.'],
      trim: true,
      minlength: [2, 'Project title must be at least 2 characters long.'],
      maxlength: [120, 'Project title cannot exceed 120 characters.']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Project description cannot exceed 1000 characters.'],
      default: ''
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active'
    }
  },
  {
    timestamps: true
  }
);

// Indexing the owner field keeps owner-centric project listing fast as the collection grows.
projectSchema.index({ owner: 1 });

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
