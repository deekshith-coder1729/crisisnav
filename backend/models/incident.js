import mongoose from "mongoose";

const incidentSchema = new mongoose.Schema(
  {
    type: String,
    lat: Number,
    lng: Number,
    severity: { type: String, default: "LOW" }, // LOW / MEDIUM / HIGH
  },
  { timestamps: true }
);

export default mongoose.model("Incident", incidentSchema);
