import mongoose, { model, models, Schema } from "mongoose";

const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
  },
  image: {
    type: String,
  },
  connectedAccounts: [
    {
      type: Schema.Types.ObjectId,
      ref: "Connection",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const User =
  (models.User as mongoose.Model<unknown>) || model("User", UserSchema);

export default User;
