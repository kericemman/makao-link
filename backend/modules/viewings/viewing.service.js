const allowedActions = new Set(["confirm", "decline", "propose_reschedule", "cancel", "complete"]);
const transitionViewing = (viewing, action, actorId, details = {}) => {
  if (!viewing || !allowedActions.has(action)) throw Object.assign(new Error("Unsupported viewing action."), { statusCode: 400 });
  const current = viewing.status;
  const updates = {};
  if (action === "confirm") {
    if (!["requested", "reschedule_proposed"].includes(current)) throw Object.assign(new Error("This viewing cannot be confirmed in its current state."), { statusCode: 409 });
    updates.status = "confirmed";
    updates.confirmedStartAt = current === "reschedule_proposed" ? viewing.proposedStartAt : viewing.requestedStartAt;
    updates.confirmedEndAt = current === "reschedule_proposed" ? viewing.proposedEndAt : viewing.requestedEndAt;
    updates.proposedStartAt = null;
    updates.proposedEndAt = null;
    updates.proposalBy = null;
    updates.proposalMessage = "";
  } else if (action === "decline") {
    if (!["requested", "reschedule_proposed"].includes(current)) throw Object.assign(new Error("This viewing cannot be declined in its current state."), { statusCode: 409 });
    updates.status = "declined";
    updates.proposalBy = actorId;
    updates.proposalMessage = String(details.message || "").trim().slice(0, 1200);
  } else if (action === "propose_reschedule") {
    if (!["requested", "confirmed"].includes(current)) throw Object.assign(new Error("A new time cannot be proposed in this state."), { statusCode: 409 });
    const start = new Date(details.startAt);
    const end = new Date(details.endAt);
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || start <= new Date() || end <= start) throw Object.assign(new Error("Choose a valid future time range."), { statusCode: 400 });
    updates.status = "reschedule_proposed";
    updates.proposedStartAt = start;
    updates.proposedEndAt = end;
    updates.proposalBy = actorId;
    updates.proposalMessage = String(details.message || "").trim().slice(0, 1200);
  } else if (action === "cancel") {
    if (!["requested", "confirmed", "reschedule_proposed"].includes(current)) throw Object.assign(new Error("This viewing can no longer be cancelled."), { statusCode: 409 });
    updates.status = "cancelled";
    updates.cancelledBy = actorId;
    updates.cancelledReason = String(details.reason || "").trim().slice(0, 500);
  } else {
    if (current !== "confirmed") throw Object.assign(new Error("Only a confirmed viewing can be completed."), { statusCode: 409 });
    if (!["viewed", "no_show", "customer_withdrew", "not_completed"].includes(details.outcome)) throw Object.assign(new Error("Choose a valid viewing outcome."), { statusCode: 400 });
    updates.status = "completed";
    updates.completedOutcome = details.outcome;
  }
  return { expectedStatus: current, expectedVersion: viewing.__v || 0, updates };
};

module.exports = { transitionViewing };
