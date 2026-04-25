const crypto = require("crypto");
const paystack = require("../../config/paystack");
const User = require("../users/user.model");
const Payment = require("./payment.model");
const Subscription = require("../subscriptions/subscription.model");
const Listing = require("../listings/listings.model");
const PartnerApplication = require("../services/partnerApplication.model");
const plans = require("./plan.config");
const sendEmail = require("../../utils/sendEmail");
const {
  restoreListingsAfterRenewal,
  markExpiredAndUnlist
} = require("../subscriptions/subscription.service");
const {
  subscriptionActivatedEmail,
  gracePeriodEmail,
  subscriptionExpiredEmail,
  partnerPaymentConfirmedEmail
} = require("../../utils/emailTemplates");

exports.initializeSubscriptionPayment = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate("subscription");

    if (!user || !user.subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    const selectedPlan = plans[user.subscription.plan];

    if (!selectedPlan) {
      return res.status(400).json({ message: "Invalid subscription plan" });
    }

    if (selectedPlan.price <= 0) {
      return res.status(400).json({
        message: "This plan does not require payment"
      });
    }

    const callbackUrl =
      process.env.PAYSTACK_CALLBACK_URL ||
      `${process.env.CLIENT_URL}/payment/callback`;

    const response = await paystack.post("/transaction/initialize", {
      email: user.email,
      amount: selectedPlan.price * 100,
      callback_url: callbackUrl,
      metadata: {
        paymentType: "subscription",
        userId: user._id.toString(),
        plan: user.subscription.plan
      }
    });

    return res.json({
      success: true,
      authorization_url: response.data.data.authorization_url,
      reference: response.data.data.reference
    });
  } catch (error) {
    console.error("Paystack initialize error:", error.response?.data || error.message);
    next(error);
  }
};

exports.verifyPaymentByReference = async (req, res, next) => {
  try {
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({ message: "Payment reference is required" });
    }

    console.log("VERIFY HIT:", reference);

    const existingPayment = await Payment.findOne({ reference });

    if (existingPayment && existingPayment.paymentType === "subscription") {
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

    console.log("VERIFY METADATA:", data?.metadata);

    if (!data || data.status !== "success") {
      return res.status(400).json({
        message: "Payment has not been confirmed as successful"
      });
    }

    const paymentType = data.metadata?.paymentType || "subscription";

    if (paymentType !== "subscription") {
      return res.status(400).json({
        message: "This verification endpoint is for subscription payments only"
      });
    }

    const userId = data.metadata?.userId;
    const plan = data.metadata?.plan;

    if (!userId || !plan) {
      return res.status(400).json({
        message: "Payment metadata is incomplete"
      });
    }

    if (String(userId) !== String(req.user._id)) {
      return res.status(403).json({
        message: "You are not allowed to verify this payment"
      });
    }

    const duplicatePayment = await Payment.findOne({ reference });

    if (!duplicatePayment) {
      await Payment.create({
        user: userId,
        reference,
        amount: data.amount / 100,
        currency: data.currency || "KES",
        plan,
        status: "success",
        paymentType: "subscription",
        paidAt: new Date()
      });
    }

    const subscription = await Subscription.findOne({ user: userId });

    if (!subscription) {
      return res.status(404).json({
        message: "Subscription record not found"
      });
    }

    const now = new Date();
    const nextBilling = new Date();
    nextBilling.setMonth(nextBilling.getMonth() + 1);

    subscription.plan = plan;
    subscription.status = "active";
    subscription.currentPeriodStart = now;
    subscription.currentPeriodEnd = nextBilling;
    subscription.gracePeriodEnd = null;
    subscription.lastPaymentDate = now;
    subscription.paystackCustomerCode =
      data.customer?.customer_code || subscription.paystackCustomerCode;
    subscription.paystackSubscriptionCode =
      data.subscription?.subscription_code || subscription.paystackSubscriptionCode;
    subscription.paystackEmailToken =
      data.subscription?.email_token || subscription.paystackEmailToken;

    await subscription.save();

    await restoreListingsAfterRenewal(userId, plan);

    const user = await User.findById(userId);

    if (user) {
      await sendEmail({
        to: user.email,
        subject: "Subscription Activated",
        html: subscriptionActivatedEmail({
          name: user.name,
          plan,
          billingEndDate: nextBilling.toDateString()
        })
      });
    }

    res.json({
      success: true,
      message: "Payment verified successfully",
      subscription
    });
  } catch (error) {
    console.error("VERIFY ERROR:", error.response?.data || error.message);
    next(error);
  }
};

exports.getMySubscription = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate("subscription");

    if (!user || !user.subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    const subscription = user.subscription;
    const planConfig = plans[subscription.plan];

    const usedListings = await Listing.countDocuments({
      landlord: req.user._id,
      isActive: true,
      availability: "available"
    });

    const payments = await Payment.find({
      user: req.user._id,
      paymentType: "subscription"
    })
      .sort({ createdAt: -1 })
      .select("reference amount currency plan status paidAt createdAt");

    res.json({
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
      console.error("Invalid Paystack signature");
      return res.status(401).send("Invalid signature");
    }

    const event = JSON.parse(req.body.toString());

    console.log("Webhook event:", event.event);
    console.log("Webhook reference:", event.data?.reference);
    console.log("Webhook metadata:", event.data?.metadata);

    switch (event.event) {
      case "charge.success":
        await handleChargeSuccess(event.data);
        break;

      case "invoice.payment_failed":
        await handlePaymentFailure(event.data);
        break;

      default:
        console.log("Unhandled Paystack event:", event.event);
        break;
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Paystack webhook error:", error);
    next(error);
  }
};

const handleChargeSuccess = async (data) => {
  const existingPayment = await Payment.findOne({ reference: data.reference });

  if (existingPayment) {
    return;
  }

  const metadata = data.metadata || {};
  const paymentType = metadata.paymentType || "subscription";
  const userId = metadata.userId;
  const plan = metadata.plan;
  const applicationId = metadata.applicationId;

  if (paymentType === "partner_application") {
    if (!applicationId) {
      console.warn("Partner application payment missing applicationId");
      return;
    }

    const application = await PartnerApplication.findById(applicationId);

    if (!application) {
      console.warn("Partner application not found:", applicationId);
      return;
    }

    application.paymentStatus = "success";
    application.paymentReference = data.reference;
    await application.save();

    await Payment.create({
      user: null,
      reference: data.reference,
      amount: data.amount / 100,
      currency: data.currency || "KES",
      plan: "normal",
      status: "success",
      paymentType: "partner_application",
      application: application._id,
      paidAt: new Date()
    });

    if (application.email) {
      await sendEmail({
        to: application.email,
        subject: "Partner Application Payment Confirmed",
        html: partnerPaymentConfirmedEmail({
          contactPerson: application.contactPerson,
          companyName: application.companyName,
          category: application.category
        })
      });
    }

    return;
  }

  if (!userId || !plan) {
    console.warn("Payment metadata missing userId or plan:", metadata);
    return;
  }

  await Payment.create({
    user: userId,
    reference: data.reference,
    amount: data.amount / 100,
    currency: data.currency || "KES",
    plan,
    status: "success",
    paymentType: "subscription",
    paidAt: new Date()
  });

  const subscription = await Subscription.findOne({ user: userId });

  if (!subscription) {
    console.warn("Subscription not found for successful payment:", userId);
    return;
  }

  const now = new Date();
  const nextBilling = new Date(now);
  nextBilling.setMonth(nextBilling.getMonth() + 1);

  subscription.plan = plan;
  subscription.status = "active";
  subscription.currentPeriodStart = now;
  subscription.currentPeriodEnd = nextBilling;
  subscription.gracePeriodEnd = null;
  subscription.lastPaymentDate = now;
  subscription.paystackCustomerCode =
    data.customer?.customer_code || subscription.paystackCustomerCode;
  subscription.paystackSubscriptionCode =
    data.subscription?.subscription_code || subscription.paystackSubscriptionCode;
  subscription.paystackEmailToken =
    data.subscription?.email_token || subscription.paystackEmailToken;

  await subscription.save();

  await restoreListingsAfterRenewal(userId, plan);

  const user = await User.findById(userId);

  if (user) {
    await sendEmail({
      to: user.email,
      subject: "Subscription Activated",
      html: subscriptionActivatedEmail({
        name: user.name,
        plan,
        billingEndDate: nextBilling.toDateString()
      })
    });
  }
};

const handlePaymentFailure = async (data) => {
  const subscriptionCode = data.subscription?.subscription_code;

  if (!subscriptionCode) {
    return;
  }

  const subscription = await Subscription.findOne({
    paystackSubscriptionCode: subscriptionCode
  }).populate("user");

  if (!subscription) {
    return;
  }

  const graceEnd = new Date();
  graceEnd.setDate(graceEnd.getDate() + 7);

  subscription.status = "grace";
  subscription.gracePeriodEnd = graceEnd;
  await subscription.save();

  if (subscription.user?.email) {
    await sendEmail({
      to: subscription.user.email,
      subject: "Payment Failed - Grace Period Started",
      html: gracePeriodEmail({
        name: subscription.user.name,
        graceEndDate: graceEnd.toDateString()
      })
    });
  }
};

exports.runExpiryCheck = async (req, res, next) => {
  try {
    const subscriptions = await Subscription.find({
      status: "grace",
      gracePeriodEnd: { $lt: new Date() }
    });

    for (const subscription of subscriptions) {
      await markExpiredAndUnlist(subscription);

      const user = await User.findById(subscription.user);

      if (user?.email) {
        await sendEmail({
          to: user.email,
          subject: "Subscription Expired - Listings Unlisted",
          html: subscriptionExpiredEmail({
            name: user.name
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

exports.changeSubscriptionPlan = async (req, res, next) => {
  try {
    const { plan } = req.body;

    if (!plan || !plans[plan]) {
      return res.status(400).json({ message: "Invalid plan selected" });
    }

    const user = await User.findById(req.user._id).populate("subscription");

    if (!user || !user.subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    const currentPlan = user.subscription.plan;
    const planOrder = ["normal", "basic", "premium", "pro"];

    const currentIndex = planOrder.indexOf(currentPlan);
    const nextIndex = planOrder.indexOf(plan);

    if (currentIndex === -1 || nextIndex === -1) {
      return res.status(400).json({ message: "Invalid subscription plan flow" });
    }

    if (plan === currentPlan) {
      return res.status(400).json({ message: "You are already on this plan" });
    }

    if (nextIndex < currentIndex) {
      return res.status(400).json({ message: "Downgrades are not supported yet" });
    }

    user.subscription.plan = plan;
    user.subscription.status = plan === "normal" ? "free" : "pending_payment";

    await user.subscription.save();

    return res.json({
      success: true,
      message: `Plan updated to ${plan.toUpperCase()}. Complete payment to activate it.`,
      subscription: user.subscription
    });
  } catch (error) {
    next(error);
  }
};