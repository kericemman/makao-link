const {
  getOwnedListingDraft,
  markListingDraftSubmitted
} = require("./listingDraft.service");

exports.getMyListingDraft = async (req, res, next) => {
  try {
    const draft = await getOwnedListingDraft({ draftId: req.params.draftId, landlordId: req.landlordOwnerId });
    return res.json({
      success: true,
      draft: {
        _id: String(draft._id),
        fields: draft.fields,
        revision: draft.revision,
        missingFields: draft.missingFields,
        status: draft.status
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.markMyListingDraftSubmitted = async (req, res, next) => {
  try {
    const result = await markListingDraftSubmitted({
      draftId: req.params.draftId,
      landlordId: req.landlordOwnerId,
      actorId: req.user._id,
      listingId: String(req.body.listingId || "")
    });
    return res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};
