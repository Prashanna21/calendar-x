import mongoose, { model, models, Schema } from "mongoose";

const ConnectionSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  provider: {
    type: String,
    enum: ["google", "outlook"],
    required: true,
  },
  providerAccountId: {
    type: String,
    required: true,
  },
  accessToken: {
    type: String,
    required: true,
  },
  refreshToken: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Number,
  },
  scope: {
    type: String,
  },
});

export const Connection =
  (models.Connection as mongoose.Model<unknown>) ||
  model("Connection", ConnectionSchema);

export default Connection;
