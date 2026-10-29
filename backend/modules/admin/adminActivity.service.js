const mongoose = require("mongoose");
const AdminActivity = require("./adminActivity.model");

exports.recordAdminActivity = async ({
  eventType,
  description,
  details = "",
  path,
  actor = null,
  actorName = "",
  readBy = [],
  entityType = "",
  entityId = "",
  dedupeKey,
  occurredAt
}) => {
  if (!eventType || !description || !path) return;

  const key = dedupeKey || (entityType && entityId ? `${eventType}:${entityType}:${entityId}` : null);
  try {
    await AdminActivity.findOneAndUpdate(
      key ? { dedupeKey: key } : { _id: new mongoose.Types.ObjectId() },
      {
        $setOnInsert: {
          eventType,
          description,
          details,
          path,
          actor,
          actorName,
          readBy,
          entityType,
          entityId,
          ...(key ? { dedupeKey: key } : {}),
          ...(occurredAt ? { createdAt: occurredAt } : {})
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (error) {
    console.error("Failed to record admin activity:", error.message);
  }
};
