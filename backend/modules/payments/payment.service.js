const Payment = require("./payment.model");
const Subscription = require("../subscriptions/subscription.model");
const plans = require("./plan.config");

const addOneMonth = (date = new Date()) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + 1);
  return next;
};

const saveSuccessfulPayment = async (data) => {
  const existingPayment = await Payment.findOne({
    reference: data.reference
  });

  if (existingPayment) {
    return { payment: existingPayment, alreadyProcessed: true };
  }

  const userId = data.metadata?.userId;
  const plan = data.metadata?.plan;

  if (!userId || !plan || !plans[plan]) {
    throw new Error("Missing or invalid payment metadata");
  }

  let subscription = await Subscription.findOne({ user: userId });

  if (!subscription) {
    subscription = await Subscription.create({
      user: userId,
      plan: "normal",
      status: "active"
    });
  }

  const payment = await Payment.create({
    user: userId,
    subscription: subscription._id,
    reference: data.reference,
    amount: Number(data.amount) / 100,
    currency: data.currency || "KES",
    plan,
    status: "success",
    paidAt: new Date()
  });

  subscription.plan = plan;
  subscription.status = "active";
  subscription.paystackCustomerCode =
    data.customer?.customer_code || subscription.paystackCustomerCode;
  subscription.paystackSubscriptionCode =
    data.subscription?.subscription_code || subscription.paystackSubscriptionCode;
  subscription.paystackEmailToken =
    data.authorization?.authorization_code || subscription.paystackEmailToken;
  subscription.currentPeriodStart = new Date();
  subscription.currentPeriodEnd = addOneMonth(new Date());
  subscription.gracePeriodEnd = null;
  subscription.cancelledAt = null;

  await subscription.save();

  return { payment, subscription, alreadyProcessed: false };
};

const markPaymentFailedAndMoveToGrace = async (data) => {
  const subscriptionCode = data.subscription?.subscription_code;

  if (!subscriptionCode) {
    return null;
  }

  const subscription = await Subscription.findOne({
    paystackSubscriptionCode: subscriptionCode
  });

  if (!subscription) {
    return null;
  }

  subscription.status = "grace";

  const graceEnd = new Date();
  graceEnd.setDate(graceEnd.getDate() + 7);

  subscription.gracePeriodEnd = graceEnd;

  await subscription.save();

  return subscription;
};

const cancelLandlordSubscription = async (subscription) => {
  subscription.status = "cancelled";
  subscription.cancelledAt = new Date();
  await subscription.save();

  return subscription;
};

module.exports = {
  saveSuccessfulPayment,
  markPaymentFailedAndMoveToGrace,
  cancelLandlordSubscription
};