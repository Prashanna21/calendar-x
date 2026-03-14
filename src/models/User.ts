import mongoose, { model, models, Schema } from "mongoose";

export type UserDocument = {
  _id: mongoose.Types.ObjectId;
  email: string;
  passwordHash: string;
  name?: string;
  image?: string;
  connectedAccounts: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
};

const UserSchema = new Schema<UserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      default: "",
      trim: true,
    },
    image: {
      type: String,
      default: "",
      trim: true,
    },
    connectedAccounts: [
      {
        type: Schema.Types.ObjectId,
        ref: "Connection",
      },
    ],
  },
  {
    timestamps: true,
  },
);

export const User =
  (models.User as mongoose.Model<UserDocument>) ||
  model<UserDocument>("User", UserSchema);

export default User;
