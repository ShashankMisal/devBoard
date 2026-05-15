const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const config = require('../../config/config');

const SALT_ROUNDS = 12;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required.'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long.'],
      maxlength: [50, 'Name cannot exceed 50 characters.']
    },
    email: {
      type: String,
      required: [true, 'Email is required.'],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Password is required.'],
      minlength: [8, 'Password must be at least 8 characters long.'],
      select: false
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    refreshToken: {
      type: String,
      default: null,
      select: false
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        // Removing secret-bearing fields here protects every controller from accidentally leaking them.
        delete ret.password;
        delete ret.refreshToken;
        delete ret.__v;

        return ret;
      }
    }
  }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) {
    return next();
  }

  // Hashing only when the password changes avoids corrupting existing hashes during profile edits.
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
  return next();
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  // bcrypt.compare handles the salt embedded in the stored hash, so callers never manage salt directly.
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateAccessToken = function generateAccessToken() {
  return jwt.sign(
    {
      userId: this._id.toString(),
      role: this.role
    },
    config.jwt.accessSecret,
    {
      expiresIn: config.jwt.accessExpiry
    }
  );
};

userSchema.methods.generateRefreshToken = function generateRefreshToken() {
  return jwt.sign(
    {
      userId: this._id.toString(),
      role: this.role
    },
    config.jwt.refreshSecret,
    {
      expiresIn: config.jwt.refreshExpiry
    }
  );
};

const User = mongoose.model('User', userSchema);

module.exports = User;
