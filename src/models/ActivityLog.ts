import mongoose, { Schema, Document, Model } from "mongoose";

export interface IActivityLog extends Document {
  action: string;
  user: string;
  details: string;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    action: { type: String, required: true },
    user: { type: String, required: true },
    details: { type: String, required: true },
  },
  { timestamps: true }
);

ActivityLogSchema.index({ createdAt: -1 });

export const ActivityLog: Model<IActivityLog> =
  mongoose.models.ActivityLog || mongoose.model<IActivityLog>("ActivityLog", ActivityLogSchema);
