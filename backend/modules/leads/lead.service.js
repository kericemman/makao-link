const Lead = require("./lead.model");

const ensureLead = async ({ sourceModel, sourceRecord, listing, advertiser, customer = null, sourceChannel, assignedAgent = null, propertyRequest = null, session = null }) => {
  const options = { upsert: true, new: true, setDefaultsOnInsert: true, ...(session ? { session } : {}) };
  return Lead.findOneAndUpdate(
    { sourceModel, sourceRecord },
    { $setOnInsert: { listing, advertiser, customer, sourceChannel, assignedAgent, stage: "new", ...(propertyRequest ? { propertyRequests: [propertyRequest] } : {}) } },
    options
  ).select("+propertyRequests");
};

const transitions = Object.freeze({
  new: ["contacted", "viewing_requested", "closed_unsuccessful"],
  contacted: ["viewing_requested", "application_negotiation", "closed_successful", "closed_unsuccessful"],
  viewing_requested: ["contacted", "viewing_confirmed", "closed_unsuccessful"],
  viewing_confirmed: ["viewed", "contacted", "closed_unsuccessful"],
  viewed: ["application_negotiation", "closed_successful", "closed_unsuccessful"],
  application_negotiation: ["closed_successful", "closed_unsuccessful"],
  closed_successful: [],
  closed_unsuccessful: []
});

const canTransitionLead = (from, to) => Boolean(transitions[from]?.includes(to));
module.exports = { ensureLead, canTransitionLead, transitions };
