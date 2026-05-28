import mongoose, { Schema } from 'mongoose';
import { IProfile } from '../types';

const ProfileSchema = new Schema<IProfile>({
  user:            { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  fullName:        String,
  phone:           String,
  location:        String,
  linkedinUrl:     String,
  githubUrl:       String,
  portfolioUrl:    String,
  yearsExperience: { type: Number, default: 0 },
  currentRole:     String,
  currentCompany:  String,
  resumeSummary:   { type: String, default: '' },
  keyAchievements: [String],
  techStack:       [String],
  preferences: {
    targetRoles: [String],
    locations:   [String],
    remoteOnly:  { type: Boolean, default: false },
  },
}, { timestamps: true });

export default mongoose.model<IProfile>('Profile', ProfileSchema);
