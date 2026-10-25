import mongoose from 'mongoose';

const { Schema, model, Types } = mongoose;
const ref = (name) => ({ type: Types.ObjectId, ref: name });

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false }, // empty for Google-only accounts
    googleId: { type: String, index: true, sparse: true },
    avatar: { type: String, default: '' },
    bio: { type: String, default: '' },
    college: { type: String, default: '' },
    city: { type: String, default: '' },
    skillsOffered: [{ type: String, trim: true }],
    skillsWanted: [{ type: String, trim: true }],
    verifiedSkills: [{ type: String, trim: true }], // quiz pass karne pe
    rating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isBanned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const swapSchema = new Schema(
  {
    sender: { ...ref('User'), required: true },
    receiver: { ...ref('User'), required: true },
    offeredSkill: { type: String, required: true },
    wantedSkill: { type: String, required: true },
    message: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  },
  { timestamps: true }
);

const sessionSchema = new Schema(
  {
    swap: { ...ref('SwapRequest'), required: true },
    participants: [ref('User')],
    title: { type: String, default: '' },
    date: { type: Date, required: true },
    meetLink: { type: String, default: '' },
    duration: { type: Number, default: 60, min: 15, max: 240 }, // minutes
    status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },
    createdBy: ref('User'),
  },
  { timestamps: true }
);

const messageSchema = new Schema(
  {
    swap: { ...ref('SwapRequest'), required: true, index: true },
    sender: { ...ref('User'), required: true },
    text: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const reviewSchema = new Schema(
  {
    session: { ...ref('Session'), required: true },
    reviewer: { ...ref('User'), required: true },
    reviewee: { ...ref('User'), required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, default: '' },
  },
  { timestamps: true }
);
reviewSchema.index({ session: 1, reviewer: 1 }, { unique: true });

const notificationSchema = new Schema(
  {
    user: { ...ref('User'), required: true, index: true },
    type: { type: String, default: 'info' },
    text: { type: String, required: true },
    link: { type: String, default: '' },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const User = model('User', userSchema);
export const SwapRequest = model('SwapRequest', swapSchema);
export const Session = model('Session', sessionSchema);
export const Message = model('Message', messageSchema);
export const Review = model('Review', reviewSchema);
export const Notification = model('Notification', notificationSchema);
