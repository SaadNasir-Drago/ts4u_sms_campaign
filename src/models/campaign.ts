import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICampaign extends Document {
  name: string;
  content: string;
  recipients: string[];
  scheduleTime: Date;
  type: 'email' | 'sms';
  status: 'scheduled' | 'active' | 'completed' | 'failed'; // Restrict to valid statuses
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    recipients: {
      type: [String], // Array of recipient emails or phone numbers
      required: true,
    },
    scheduleTime: {
      type: Date,
      required: true,
    },
    type: {
      type: String,
      enum: ['email', 'sms'],
      required: true,
      default: 'email',
    },
    status: {
      type: String,
      default: 'scheduled',
      enum: ['scheduled', 'active', 'completed', 'failed'], // Enumerated valid statuses
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// indexes for optimized queries
CampaignSchema.index({ status: 1 });
CampaignSchema.index({ 'recipients': 1 });
CampaignSchema.index({ scheduleTime: 1 });

const Campaign: Model<ICampaign> =
  mongoose.models.Campaign || mongoose.model<ICampaign>('Campaign', CampaignSchema);

export default Campaign;
