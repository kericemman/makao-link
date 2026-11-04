const AuditRecord = require("./auditRecord.model");

const recordAuthorizationChange = (req, { action, resourceType, resourceId, organization = null, changes = {}, session = null }) => {
  const record = {
    actor: req.user._id,
    action,
    resourceType,
    resourceId: String(resourceId),
    organization,
    changes,
    requestId: String(req.id || req.headers["x-request-id"] || "").slice(0, 120),
    ip: String(req.ip || "").slice(0, 80)
  };
  return session ? AuditRecord.create([record], { session }).then(([created]) => created) : AuditRecord.create(record);
};

module.exports = { recordAuthorizationChange };
