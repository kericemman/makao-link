const crypto = require("crypto");
const paystack = require("../../config/paystack");

const User = require("../users/user.model");
const Payment = require("./payment.model");
const Subscription = require("../subscriptions/subscription.model");
const Listing = require("../listings/listings.model");
const WhatsAppListingAddon = require("./whatsappListingAddon.model");
const { recordAdminActivity } = require("../admin/adminActivity.service");

const sendEmail = require("../../utils/sendEmail");

const {
  subscriptionActivatedEmail,
  gracePeriodEmail,
  subscriptionExpiredEmail
} = require("../../utils/emailTemplates");

const plans = require("./plan.config");

const {
  restoreListingsAfterRenewal,
  markExpiredAndUnlist,
  processScheduledFreeDowngrades
} = require("../subscriptions/subscription.service");

const addOneMonth = () => {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date;
};

const expectedPlanPayment = (data, planKey) => {
  const plan = plans[planKey];
  return Boolean(
    plan &&
      plan.price > 0 &&
      Number(data?.amount) === plan.price * 100 &&
      data?.currency === "KES"
  );
};

const verifyConfiguredPlan = async (plan) => {
  try {
    const response = await paystack.get(`/plan/${encodeURIComponent(plan.paystackPlanCode)}`);
    const configuredPlan = response.data?.data;
    return Boolean(
      Number(configuredPlan?.amount) === plan.price * 100 &&
        configuredPlan?.currency === "KES" &&
        configuredPlan?.interval === "monthly"
    );
  } catch {
    return false;
  }
};

const WHATSAPP_ADDON_PRICE = 300;
const WHATSAPP_ADDON_PLAN = process.env.PAYSTACK_WHATSAPP_SUPPORT;

const getAddonPeriodEnd = (subscription) => {
  const nextPaymentDate = subscription?.next_payment_date;
  const parsed = nextPaymentDate ? new Date(nextPaymentDate) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed : addOneMonth();
};

const activateWhatsAppAddon = async ({ userId, reference, data }) => {
  if (!data?.subscription?.subscription_code || !data?.subscription?.email_token) return null;

  const addon = await WhatsAppListingAddon.findOne({
    user: userId,
    pendingReference: reference
  });

  if (!addon) return null;

  addon.status = "active";
  addon.pendingReference = null;
  addon.lastPaymentReference = reference;
  addon.lastPaymentDate = new Date();
  addon.currentPeriodEnd = getAddonPeriodEnd(data?.subscription);
  addon.paystackCustomerCode = data?.customer?.customer_code || addon.paystackCustomerCode;
  addon.paystackSubscriptionCode =
    data?.subscription?.subscription_code || addon.paystackSubscriptionCode;
  addon.paystackEmailToken = data?.subscription?.email_token || addon.paystackEmailToken;
  await addon.save();

  return addon;
};

const getAddonSubscriptionCode = (data) =>
  data?.subscription?.subscription_code || data?.subscription_code || null;

const updateRecurringWhatsAppAddon = async (data) => {
  const subscriptionCode = getAddonSubscriptionCode(data);
  if (!subscriptionCode) return null;

  const addon = await WhatsAppListingAddon.findOne({
    paystackSubscriptionCode: subscriptionCode
  });
  if (!addon) return null;

  addon.status = "active";
  addon.lastPaymentReference = data.reference || addon.lastPaymentReference;
  addon.lastPaymentDate = new Date();
  addon.currentPeriodEnd = getAddonPeriodEnd(data.subscription);
  await addon.save();
  return addon;
};

const stopWhatsAppAddonRenewal = async (userId) => {
  const addon = await WhatsAppListingAddon.findOne({
    user: userId,
    status: { $in: ["active", "past_due"] }
  });
  if (!addon) return;

  if (!addon.paystackSubscriptionCode || !addon.paystackEmailToken) {
    throw new Error("WhatsApp add-on is missing Paystack cancellation credentials");
  }

  await paystack.post("/subscription/disable", {
    code: addon.paystackSubscriptionCode,
    token: addon.paystackEmailToken
  });
  addon.status = "non_renewing";
  await addon.save();
};

exports.getWhatsAppListingAddon = async (req, res, next) => {
  try {
    const [subscription, addon] = await Promise.all([
      Subscription.findOne({ user: req.user._id }),
      WhatsAppListingAddon.findOne({ user: req.user._id })
    ]);

    const plan = subscription?.plan || "normal";
    const basePlanActive = ["free", "active"].includes(subscription?.status);
    const eligible = basePlanActive && ["normal", "basic"].includes(plan);
    const included = basePlanActive && ["premium", "pro"].includes(plan);
    const periodActive = addon?.currentPeriodEnd && addon.currentPeriodEnd > new Date();
    const active = Boolean(
      addon &&
        ((addon.status === "active" && (!addon.currentPeriodEnd || periodActive)) ||
          (addon.status === "non_renewing" && periodActive))
    );

    return res.json({
      success: true,
      price: WHATSAPP_ADDON_PRICE,
      currency: "KES",
      interval: "monthly",
      eligible,
      included,
      configured: Boolean(WHATSAPP_ADDON_PLAN),
      active,
      addon: addon || null
    });
  } catch (error) {
    next(error);
  }
};

exports.initializeWhatsAppListingAddon = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({ user: req.user._id });
    const plan = subscription?.plan || "normal";
    if (!["normal", "basic"].includes(plan)) {
      return res.status(400).json({
        message: "Direct WhatsApp listing is only an add-on for Free and Basic plans."
      });
    }

    if (!subscription || !["free", "active"].includes(subscription.status)) {
      return res.status(400).json({
        message: "Activate your landlord plan before adding direct WhatsApp listing."
      });
    }

    if (!WHATSAPP_ADDON_PLAN) {
      return res.status(503).json({
        message: "WhatsApp add-on billing is not configured yet. Please contact RendaHomes support."
      });
    }

    let planDetails;
    try {
      const configuredPlan = await paystack.get(`/plan/${encodeURIComponent(WHATSAPP_ADDON_PLAN)}`);
      planDetails = configuredPlan.data?.data;
    } catch {
      return res.status(503).json({ message: "The WhatsApp add-on billing plan could not be verified." });
    }
    if (
      Number(planDetails?.amount) !== WHATSAPP_ADDON_PRICE * 100 ||
      planDetails?.interval !== "monthly" ||
      planDetails?.currency !== "KES"
    ) {
      return res.status(503).json({
        message: "The WhatsApp add-on billing plan must be configured for KES 300 monthly. Please contact support."
      });
    }

    const existing = await WhatsAppListingAddon.findOne({ user: req.user._id });
    const stillActive =
      existing &&
      ["active", "non_renewing"].includes(existing.status) &&
      (!existing.currentPeriodEnd || existing.currentPeriodEnd > new Date());
    if (stillActive) {
      return res.status(409).json({ message: "Direct WhatsApp listing is already active." });
    }

    const user = await User.findById(req.user._id);
    if (!user?.email) {
      return res.status(400).json({ message: "A verified email is required for recurring billing." });
    }

    const callbackUrl =
      process.env.PAYSTACK_CALLBACK_URL ||
      `${process.env.CLIENT_URL}/payment/callback`;
    const response = await paystack.post("/transaction/initialize", {
      email: user.email,
      amount: WHATSAPP_ADDON_PRICE * 100,
      plan: WHATSAPP_ADDON_PLAN,
      callback_url: callbackUrl,
      metadata: {
        paymentType: "whatsapp_listing_addon",
        userId: user._id.toString(),
        addonKey: "whatsapp_listing"
      }
    });

    const reference = response.data.data.reference;
    await WhatsAppListingAddon.findOneAndUpdate(
      { user: req.user._id },
      {
        $set: {
          status: "pending_payment",
          pendingReference: reference
        },
        $setOnInsert: { user: req.user._id }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({
      success: true,
      authorization_url: response.data.data.authorization_url,
      reference
    });
  } catch (error) {
    next(error);
  }
};

exports.cancelWhatsAppListingAddon = async (req, res, next) => {
  try {
    const addon = await WhatsAppListingAddon.findOne({ user: req.user._id });
    if (!addon || !["active", "past_due"].includes(addon.status)) {
      return res.status(404).json({ message: "No renewable WhatsApp add-on was found." });
    }

    if (!addon.paystackSubscriptionCode || !addon.paystackEmailToken) {
      return res.status(409).json({
        message: "This add-on cannot be cancelled online. Please contact RendaHomes support."
      });
    }

    await paystack.post("/subscription/disable", {
      code: addon.paystackSubscriptionCode,
      token: addon.paystackEmailToken
    });

    addon.status = "non_renewing";
    await addon.save();

    return res.json({
      success: true,
      message: "Auto-renewal cancelled. Direct WhatsApp listing stays active until the paid period ends.",
      addon
    });
  } catch (error) {
    next(error);
  }
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

  if (!reference || !expectedPlanPayment({ amount: amount * 100, currency }, plan)) {
    throw new Error("Subscription payment does not match the selected plan");
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

  if (payment && String(payment.user) !== String(userId)) {
    throw new Error("Payment reference is already associated with another account");
  }

  if (payment?.status === "success") {
    return { payment, subscription, alreadyProcessed: true };
  }

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

  const previousSubscriptionCode = subscription.paystackSubscriptionCode;
  const previousEmailToken = subscription.paystackEmailToken;
  const shouldSendActivationEmail =
    subscription.status !== "active" || subscription.plan !== plan;
  const now = new Date();

  subscription.plan = plan;
  subscription.pendingPlan = null;
  subscription.pendingPaymentReference = null;
  subscription.downgradeToFreeAt = null;
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

  if (
    previousSubscriptionCode &&
    previousEmailToken &&
    subscriptionCode &&
    previousSubscriptionCode !== subscriptionCode
  ) {
    try {
      await paystack.post("/subscription/disable", {
        code: previousSubscriptionCode,
        token: previousEmailToken
      });
    } catch (error) {
      console.error("FAILED TO STOP PREVIOUS PAYSTACK SUBSCRIPTION:", error.message);
    }
  }

  if (["premium", "pro"].includes(plan)) {
    try {
      await stopWhatsAppAddonRenewal(userId);
    } catch (error) {
      console.error("FAILED TO STOP INCLUDED WHATSAPP ADD-ON RENEWAL:", error.message);
    }
  }

  await restoreListingsAfterRenewal(userId, plan);

  const user = await User.findById(userId);

  await recordAdminActivity({
    eventType: "payment_received",
    description: "Subscription payment received",
    details: `KES ${payment.amount.toLocaleString()} • ${plan} plan • ${payment.reference}`,
    path: "/admin/payments",
    actor: userId,
    actorName: user?.name || "Landlord",
    entityType: "payment",
    entityId: String(payment._id)
  });

    if (user?.email && shouldSendActivationEmail) {
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

    if (plan === "normal") {
      if (subscription.downgradeToFreeAt) {
        return res.json({
          success: true,
          message: `Free plan is already scheduled for ${subscription.downgradeToFreeAt.toLocaleDateString()}.`,
          requiresPayment: false,
          subscription
        });
      }

      if (subscription.plan !== "normal" && subscription.paystackSubscriptionCode) {
        if (!subscription.paystackSubscriptionCode || !subscription.paystackEmailToken) {
          return res.status(409).json({
            message: "This subscription cannot be downgraded online. Please contact support to avoid further charges."
          });
        }

        await paystack.post("/subscription/disable", {
          code: subscription.paystackSubscriptionCode,
          token: subscription.paystackEmailToken
        });

        if (subscription.status === "active" && subscription.currentPeriodEnd > new Date()) {
          subscription.downgradeToFreeAt = subscription.currentPeriodEnd;
          subscription.pendingPlan = null;
          subscription.pendingPaymentReference = null;
          await subscription.save();
          return res.json({
            success: true,
            message: `Free plan scheduled for ${subscription.downgradeToFreeAt.toLocaleDateString()}. Your current paid access remains active until then.`,
            requiresPayment: false,
            subscription
          });
        }
      } else if (subscription.plan !== "normal" && subscription.status === "active") {
        return res.status(409).json({
          message: "This subscription has no cancellation credentials. Please contact support before changing your plan."
        });
      }
      if (subscription.plan !== "normal") {
        subscription.downgradeToFreeAt = new Date();
        await subscription.save();
        await processScheduledFreeDowngrades();
        const updatedSubscription = await Subscription.findById(subscription._id);
        return res.json({
          success: true,
          message: "Changed to Free plan",
          requiresPayment: false,
          subscription: updatedSubscription
        });
      }

      subscription.pendingPlan = null;
      subscription.pendingPaymentReference = null;
      subscription.downgradeToFreeAt = null;
      subscription.status = "free";
      await subscription.save();
      return res.json({ success: true, message: "Changed to Free plan", requiresPayment: false, subscription });
    }

    if (subscription.plan === plan && subscription.status === "active") {
      return res.json({ success: true, message: "This plan is already active", requiresPayment: false, subscription });
    }

    const selectedPlan = plans[plan];
    if (!selectedPlan.paystackPlanCode) {
      return res.status(503).json({ message: `${selectedPlan.name} billing is not configured.` });
    }

    subscription.pendingPlan = plan;
    subscription.pendingPaymentReference = null;

    if (subscription.status !== "active") {
      subscription.plan = plan;
      subscription.status = "pending_payment";
    }

    await subscription.save();

    return res.json({
      success: true,
      message: `Complete payment to activate the ${plans[plan].name} plan. Your current access stays unchanged until then.`,
      requiresPayment: true,
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

    const planKey = user.subscription.pendingPlan || user.subscription.plan;
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

    const planIsConfigured = await verifyConfiguredPlan(selectedPlan);
    if (!planIsConfigured) {
      return res.status(503).json({
        message: `${selectedPlan.name} Paystack plan must be configured for KES ${selectedPlan.price} monthly.`
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

    user.subscription.pendingPaymentReference = response.data.data.reference;
    user.subscription.pendingPlan = planKey;
    await user.subscription.save();

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

    const addon = await WhatsAppListingAddon.findOne({
      user: req.user._id,
      $or: [{ pendingReference: reference }, { lastPaymentReference: reference }]
    });

    if (addon?.lastPaymentReference === reference && addon.status !== "pending_payment") {
      return res.json({ success: true, message: "WhatsApp add-on payment already verified", addon });
    }

    if (addon?.pendingReference === reference) {
      const addonResponse = await paystack.get(`/transaction/verify/${reference}`);
      const addonPayment = addonResponse.data?.data;
      const addonMetadata = addonPayment?.metadata || {};

      if (
        addonPayment?.status !== "success" ||
        addonMetadata.paymentType !== "whatsapp_listing_addon" ||
        String(addonMetadata.userId) !== String(req.user._id) ||
        Number(addonPayment.amount) !== WHATSAPP_ADDON_PRICE * 100 ||
        addonPayment.currency !== "KES"
      ) {
        return res.status(400).json({ message: "WhatsApp add-on payment could not be verified." });
      }

      const activatedAddon = await activateWhatsAppAddon({
        userId: req.user._id,
        reference,
        data: addonPayment
      });

      if (!activatedAddon) {
        return res.status(409).json({ message: "WhatsApp add-on payment is still being processed." });
      }

      return res.json({
        success: true,
        message: "Direct WhatsApp listing activated",
        addon: activatedAddon
      });
    }

    const existingPayment = await Payment.findOne({ reference });

    if (existingPayment) {
      if (String(existingPayment.user) !== String(req.user._id)) {
        return res.status(403).json({ message: "Payment does not belong to this user" });
      }
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

    const subscription = await Subscription.findOne({ user: req.user._id });
    const expectedPlan = subscription?.pendingPlan || subscription?.plan;
    if (
      !subscription ||
      data.reference !== reference ||
      subscription.pendingPaymentReference !== reference ||
      expectedPlan !== appPlan ||
      !expectedPlanPayment(data, appPlan)
    ) {
      return res.status(400).json({ message: "Payment reference, plan, amount, or currency did not match checkout." });
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
    const ownerId = req.landlordOwnerId || req.user._id;
    const subscription = await Subscription.findOne({ user: ownerId });

    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    const planConfig = plans[subscription.plan];

    const usedListings = await Listing.countDocuments({
      landlord: ownerId,
      isActive: true,
      availability: "available"
    });

    const payments = await Payment.find({ user: ownerId })
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
    const secret = process.env.PAYSTACK_SECRET_KEY;

    if (!secret || !Buffer.isBuffer(req.body) || typeof signature !== "string" || !/^[a-f\d]{128}$/i.test(signature)) {
      return res.status(401).send("Invalid signature");
    }

    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
      .update(req.body)
      .digest();
    const providedSignature = Buffer.from(signature, "hex");

    if (hash.length !== providedSignature.length || !crypto.timingSafeEqual(hash, providedSignature)) {
      console.error("Invalid Paystack webhook signature");
      return res.status(401).send("Invalid signature");
    }

    const event = JSON.parse(req.body.toString());

    console.log("WEBHOOK EVENT:", event.event);

    if (event.event === "charge.success") {
      const data = event.data;
      const metadata = data.metadata || {};

      if (metadata.paymentType === "whatsapp_listing_addon") {
        if (metadata.userId && Number(data.amount) === WHATSAPP_ADDON_PRICE * 100 && data.currency === "KES") {
          const activated = await activateWhatsAppAddon({
            userId: metadata.userId,
            reference: data.reference,
            data
          });
          if (!activated) await updateRecurringWhatsAppAddon(data);
        }
      } else if (metadata.paymentType === "subscription") {
        const sub = await Subscription.findOne({ user: metadata.userId });
        const incomingPlan = metadata.appPlan;
        const matchesInitialCheckout = sub?.pendingPaymentReference === data.reference;
        const matchesRecurringPlan =
          sub?.paystackSubscriptionCode &&
          sub.paystackSubscriptionCode === data.subscription?.subscription_code &&
          sub.plan === incomingPlan;

        if (
          sub &&
          plans[incomingPlan] &&
          data.reference &&
          expectedPlanPayment(data, incomingPlan) &&
          (matchesInitialCheckout || matchesRecurringPlan)
        ) {
          await activateSubscription({
            userId: metadata.userId,
            plan: incomingPlan,
            reference: data.reference,
            amount: data.amount / 100,
            currency: data.currency,
            customerCode: data.customer?.customer_code,
            subscriptionCode: data.subscription?.subscription_code,
            emailToken: data.subscription?.email_token
          });
        }
      } else {
        const recurringSubscription = await Subscription.findOne({
          paystackSubscriptionCode: getAddonSubscriptionCode(data)
        });

        if (recurringSubscription && expectedPlanPayment(data, recurringSubscription.plan)) {
          await activateSubscription({
            userId: recurringSubscription.user,
            plan: recurringSubscription.plan,
            reference: data.reference,
            amount: data.amount / 100,
            currency: data.currency,
            customerCode: data.customer?.customer_code,
            subscriptionCode: data.subscription?.subscription_code,
            emailToken: data.subscription?.email_token
          });
        } else if (Number(data.amount) === WHATSAPP_ADDON_PRICE * 100 && data.currency === "KES") {
          await updateRecurringWhatsAppAddon(data);
        }
      }
    }

    if (event.event === "invoice.payment_failed") {
      const subscriptionCode = getAddonSubscriptionCode(event.data);

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

        const addon = await WhatsAppListingAddon.findOne({
          paystackSubscriptionCode: subscriptionCode
        });
        if (addon) {
          addon.status = "past_due";
          await addon.save();
        }
      }
    }

    if (["subscription.disable", "subscription.not_renew"].includes(event.event)) {
      const subscriptionCode = getAddonSubscriptionCode(event.data);
      if (subscriptionCode) {
        await WhatsAppListingAddon.findOneAndUpdate(
          { paystackSubscriptionCode: subscriptionCode },
          { $set: { status: "non_renewing" } }
        );
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

    const downgraded = await processScheduledFreeDowngrades();

    return res.json({
      success: true,
      message: "Subscription expiry and scheduled downgrade checks completed",
      downgraded
    });
  } catch (error) {
    next(error);
  }
};
