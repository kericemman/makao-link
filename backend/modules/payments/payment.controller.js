const crypto = require("crypto");
const paystack = require("../../config/paystack");

const User = require("../users/user.model");
const Payment = require("./payment.model");
const Subscription = require("../subscriptions/subscription.model");
const Listing = require("../listings/listings.model");

const sendEmail = require("../../utils/sendEmail");

const {
  subscriptionActivatedEmail,
  gracePeriodEmail,
  subscriptionExpiredEmail
} = require("../../utils/emailTemplates");

const plans = require("./plan.config");

const {
  restoreListingsAfterRenewal,
  markExpiredAndUnlist
} = require("../subscriptions/subscription.service");

const addOneMonth = () => {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date;
};

const activateSubscription = async ({
  userId,
  plan,
  reference,
  amount,
  currency,
  customerCode,
  subscriptionCode,
  emailToken
}) => {
  if (!userId || !plan || !plans[plan]) {
    throw new Error("Invalid subscription activation data");
  }

  let subscription = await Subscription.findOne({ user: userId });

  if (!subscription) {
    subscription = await Subscription.create({
      user: userId,
      plan: "normal",
      status: "free"
    });
  }

  let payment = await Payment.findOne({ reference });

  if (!payment) {
    payment = await Payment.create({
      user: userId,
      subscription: subscription._id,
      reference,
      amount,
      currency: currency || "KES",
      plan,
      status: "success",
      paidAt: new Date()
    });
  }

  const now = new Date();

  subscription.plan = plan;
  subscription.status = "active";
  subscription.currentPeriodStart = now;
  subscription.currentPeriodEnd = addOneMonth();
  subscription.gracePeriodEnd = null;
  subscription.lastPaymentDate = now;
  subscription.paystackCustomerCode = customerCode || subscription.paystackCustomerCode;
  subscription.paystackSubscriptionCode =
    subscriptionCode || subscription.paystackSubscriptionCode;
  subscription.paystackEmailToken = emailToken || subscription.paystackEmailToken;

  await subscription.save();

  await restoreListingsAfterRenewal(userId, plan);

  const user = await User.findById(userId);

    if (user?.email) {
      await sendEmail({
        to: user.email,
        subject: "Subscription Activated",
        html: subscriptionActivatedEmail({
          name: user.name || "Landlord",
          plan,
          billingEndDate: subscription.currentPeriodEnd.toDateString()
        })
      });
    }

  return { payment, subscription };
};

exports.changeSubscriptionPlan = async (req, res, next) => {
  try {
    const { plan } = req.body;

    if (!plan || !plans[plan]) {
      return res.status(400).json({ message: "Invalid plan selected" });
    }

    const subscription = await Subscription.findOne({ user: req.user._id });

    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    const currentPlan = plans[subscription.plan] || plans.normal;
    const nextPlan = plans[plan];
    const isDowngrade =
      nextPlan.price <= currentPlan.price &&
      ["active", "free"].includes(subscription.status);
    const requiresPayment = plan !== "normal" && !isDowngrade;

    subscription.plan = plan;
    subscription.status = plan === "normal" ? "free" : requiresPayment ? "pending_payment" : "active";

    if (plan === "normal") {
      subscription.currentPeriodStart = null;
      subscription.currentPeriodEnd = null;
      subscription.gracePeriodEnd = null;
      subscription.paystackSubscriptionCode = null;
      subscription.paystackEmailToken = null;
    }

    await subscription.save();

    return res.json({
      success: true,
      message:
        plan === "normal"
          ? "Changed to free plan"
          : requiresPayment
            ? `Plan changed to ${plans[plan].name}. Complete payment to activate.`
            : `Plan changed to ${plans[plan].name}.`,
      requiresPayment,
      subscription
    });
  } catch (error) {
    next(error);
  }
};

exports.initializeSubscriptionPayment = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate("subscription");

    if (!user || !user.subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    const planKey = user.subscription.plan;
    const selectedPlan = plans[planKey];

    if (!selectedPlan) {
      return res.status(400).json({ message: "Invalid subscription plan" });
    }

    if (planKey === "normal" || selectedPlan.price <= 0) {
      return res.status(400).json({
        message: "This plan does not require payment"
      });
    }

    if (!selectedPlan.paystackPlanCode) {
      return res.status(400).json({
        message: `${selectedPlan.name} Paystack plan code is missing`
      });
    }

//    
    const callbackUrl =
      process.env.PAYSTACK_CALLBACK_URL ||
      `${process.env.CLIENT_URL}/payment/callback`;

    const response = await paystack.post("/transaction/initialize", {
      email: user.email,
      amount: selectedPlan.price * 100,
      plan: selectedPlan.paystackPlanCode,
      callback_url: callbackUrl,
      metadata: {
        paymentType: "subscription",
        userId: user._id.toString(),
        appPlan: planKey,
        paystackPlanCode: selectedPlan.paystackPlanCode
      }
    });

    return res.json({
      success: true,
      authorization_url: response.data.data.authorization_url,
      reference: response.data.data.reference
    });
  } catch (error) {
    console.error("INITIALIZE SUBSCRIPTION ERROR:", error.response?.data || error.message);
    next(error);
  }
};

exports.verifyPaymentByReference = async (req, res, next) => {
  try {
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({ message: "Payment reference is required" });
    }

    const existingPayment = await Payment.findOne({ reference });

    if (existingPayment) {
      const subscription = await Subscription.findOne({ user: req.user._id });

      return res.json({
        success: true,
        message: "Payment already verified",
        payment: existingPayment,
        subscription
      });
    }

    const response = await paystack.get(`/transaction/verify/${reference}`);
    const data = response.data?.data;

    // console.log("PAYSTACK VERIFY STATUS:", data?.status);
    // console.log("PAYSTACK VERIFY METADATA:", data?.metadata);
    // console.log("PAYSTACK VERIFY SUBSCRIPTION:", data?.subscription);

    if (!data || data.status !== "success") {
      return res.status(400).json({ message: "Payment not successful" });
    }

    const paymentType = data.metadata?.paymentType;
    const userId = data.metadata?.userId;
    const appPlan = data.metadata?.appPlan;

    if (paymentType !== "subscription") {
      return res.status(400).json({ message: "Invalid payment type" });
    }

    if (!userId || !appPlan || !plans[appPlan]) {
      return res.status(400).json({ message: "Invalid payment metadata" });
    }

    if (String(userId) !== String(req.user._id)) {
      return res.status(403).json({
        message: "Payment does not belong to this user"
      });
    }

    const result = await activateSubscription({
      userId,
      plan: appPlan,
      reference: data.reference,
      amount: data.amount / 100,
      currency: data.currency || "KES",
      customerCode: data.customer?.customer_code,
      subscriptionCode: data.subscription?.subscription_code,
      emailToken: data.subscription?.email_token
    });

    return res.json({
      success: true,
      message: "Payment verified successfully",
      payment: result.payment,
      subscription: result.subscription
    });
  } catch (error) {
    console.error("VERIFY PAYMENT ERROR:", error.response?.data || error.message);
    next(error);
  }
};

exports.getMySubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({ user: req.user._id });

    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    const planConfig = plans[subscription.plan];

    const usedListings = await Listing.countDocuments({
      landlord: req.user._id,
      isActive: true,
      availability: "available"
    });

    const payments = await Payment.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select("reference amount currency plan status paidAt createdAt");

    return res.json({
      success: true,
      subscription,
      usage: {
        used: usedListings,
        limit: planConfig?.listingLimit || 0,
        remaining: Math.max((planConfig?.listingLimit || 0) - usedListings, 0)
      },
      planDetails: {
        name: planConfig?.name || "Unknown",
        price: planConfig?.price || 0,
        listingLimit: planConfig?.listingLimit || 0
      },
      payments
    });
  } catch (error) {
    next(error);
  }
};

exports.paystackWebhook = async (req, res, next) => {
  try {
    const signature = req.headers["x-paystack-signature"];

    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
      .update(req.body)
      .digest("hex");

    if (hash !== signature) {
      console.error("Invalid Paystack webhook signature");
      return res.status(401).send("Invalid signature");
    }

    const event = JSON.parse(req.body.toString());

    console.log("WEBHOOK EVENT:", event.event);

    if (event.event === "charge.success") {
      const data = event.data;
      const metadata = data.metadata || {};

      if (metadata.paymentType === "subscription") {
        await activateSubscription({
          userId: metadata.userId,
          plan: metadata.appPlan,
          reference: data.reference,
          amount: data.amount / 100,
          currency: data.currency || "KES",
          customerCode: data.customer?.customer_code,
          subscriptionCode: data.subscription?.subscription_code,
          emailToken: data.subscription?.email_token
        });
      }
    }

    if (event.event === "invoice.payment_failed") {
      const subscriptionCode = event.data?.subscription?.subscription_code;

      if (subscriptionCode) {
        const subscription = await Subscription.findOne({
          paystackSubscriptionCode: subscriptionCode
        });

        if (subscription) {
          const graceEnd = new Date();
          graceEnd.setDate(graceEnd.getDate() + 7);

          subscription.status = "grace";
          subscription.gracePeriodEnd = graceEnd;

          await subscription.save();

          const user = await User.findById(subscription.user);

            if (user?.email) {
              await sendEmail({
                to: user.email,
                subject: "Payment Failed — Grace Period Started",
                html: gracePeriodEmail({
                  name: user.name || "Landlord",
                  graceEndDate: graceEnd.toDateString()
                })
              });
            }
        }
      }
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error("WEBHOOK ERROR:", error.message);
    next(error);
  }
};

exports.runExpiryCheck = async (req, res, next) => {
  try {
    const expiredGraceSubscriptions = await Subscription.find({
      status: "grace",
      gracePeriodEnd: { $lt: new Date() }
    });

    for (const subscription of expiredGraceSubscriptions) {
      await markExpiredAndUnlist(subscription);

      await markExpiredAndUnlist(subscription);

      const user = await User.findById(subscription.user);

      if (user?.email) {
        await sendEmail({
          to: user.email,
          subject: "Subscription Expired",
          html: subscriptionExpiredEmail({
            name: user.name || "Landlord"
          })
        });
      }
    }

    return res.json({
      success: true,
      message: "Expiry check completed"
    });
  } catch (error) {
    next(error);
  }
};
