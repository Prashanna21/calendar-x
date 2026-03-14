import mongoose, { model, models, Schema } from "mongoose";

const BoardCalendarSchema = new Schema(
  {
    connectionId: {
      type: Schema.Types.ObjectId,
      ref: "Connection",
      required: true,
    },
    provider: {
      type: String,
      enum: ["google", "outlook"],
      required: true,
    },
    calendarId: {
      type: String,
      required: true,
    },
    calendarName: {
      type: String,
      required: true,
    },
    color: {
      type: String,
    },
  },
  { _id: false },
);

const BoardSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    selectedCalendars: {
      type: [BoardCalendarSchema],
      default: [],
    },
    visibility: {
      masked: {
        type: Boolean,
        default: false,
      },
      hidePastEvents: {
        type: Boolean,
        default: false,
      },
      pastDays: {
        type: Number,
        default: 0,
      },
      futureDays: {
        type: Number,
        default: 14,
      },
    },
  },
  { timestamps: true },
);

export const Board =
  (models.Board as mongoose.Model<unknown>) || model("Board", BoardSchema);

export default Board;
