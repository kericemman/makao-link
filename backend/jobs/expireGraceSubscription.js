const Subscription = require("../modules/subscriptions/subscription.model");

const expireGraceSubscriptions = async () => {
  try {
    const now = new Date();

    const result = await Subscription.updateMany(
      {
        status: "grace",
        gracePeriodEnd: { $lt: now }
      },
      {
        $set: {
          status: "expired"
        }
      }
    );

    console.log(
      `[expireGraceSubscriptions] Updated ${result.modifiedCount || 0} subscriptions`
    );
  } catch (error) {
    console.error("[expireGraceSubscriptions] Error:", error.message);
  }
};

module.exports = expireGraceSubscriptions;