const mongoose = require("mongoose");

const agentMatchProposalSchema = new mongoose.Schema({
  propertyRequest: { type: mongoose.Schema.Types.ObjectId, ref: "PropertyRequest", required: true, index: true },
  listing: { type: mongoose.Schema.Types.ObjectId, ref: "Listing", required: true, index: true },
  agent: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  classification: { type: String, enum: ["exact", "alternative"], required: true },
  message: { type: String, trim: true, maxlength: 500, default: "" },
  status: { type: String, enum: ["proposed", "accepted", "declined", "withdrawn"], default: "proposed", index: true },
  respondedAt: { type: Date, default: null }
}, { timestamps: true, versionKey: "__v" });

agentMatchProposalSchema.index({ propertyRequest: 1, agent: 1 }, { unique: true });
agentMatchProposalSchema.index({ propertyRequest: 1, status: 1 }, {
  unique: true,
  partialFilterExpression: { status: "accepted" }
});

module.exports = mongoose.model("AgentMatchProposal", agentMatchProposalSchema);
