import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISettings {
  allowUserSubmissions: boolean;
  updatedAt: Date;
}

export interface ISettingsDocument extends ISettings, Document {}

interface ISettingsModel extends Model<ISettingsDocument> {
  getSettings(): Promise<ISettingsDocument>;
}

const SettingsSchema = new Schema<ISettingsDocument, ISettingsModel>(
  {
    allowUserSubmissions: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

SettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({ allowUserSubmissions: true });
  }
  return settings;
};

try { mongoose.deleteModel('Settings'); } catch {}
const Settings =
  mongoose.model<ISettingsDocument, ISettingsModel>('Settings', SettingsSchema);

export default Settings;
