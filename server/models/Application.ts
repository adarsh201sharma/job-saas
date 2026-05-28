import mongoose, { Schema } from 'mongoose';
import { IApplication } from '../types';

const ApplicationSchema = new Schema<IApplication>({
  user:           { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  company:        { type: String, required: true },
  role:           { type: String, required: true },
  location:       String,
  jobLink:        String,
  jobDescription: String,
  status: {
    type: String,
    enum: ['Saved', 'Applied', 'Referral Sent', 'Interview', 'Offer', 'Rejected', 'Ghosted'],
    default: 'Saved',
  },
  referralContact: String,
  followUpDate:    Date,
  notes:           String,
  generatedMessages: {
    coldEmail:       { subject: String, body: String },
    linkedinNote:    String,
    referralMessage: String,
    indeedPara:      String,
  },
  appliedDate: Date,
}, { timestamps: true });

export default mongoose.model<IApplication>('Application', ApplicationSchema);
