const Listing = require("../modules/listings/listings.model");

const purgeDeletedListings = async () => {
  try {
    const result = await Listing.deleteMany({
      isDeleted: true,
      deleteExpiresAt: { $lte: new Date() }
    });

    console.log(`[purgeDeletedListings] Permanently deleted ${result.deletedCount || 0} listings`);
  } catch (error) {
    console.error("[purgeDeletedListings] Error:", error.message);
  }
};

module.exports = purgeDeletedListings;
