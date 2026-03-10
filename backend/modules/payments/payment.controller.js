const paystack = require("../../config/paystack");
const Payment = require("./payment.model");
const plans = require("../subscriptions/plan.config");

exports.initializePayment = async (req, res) => {

    try {
  
      const { plan } = req.body;
  
      const selectedPlan = plans[plan];
  
      if (!selectedPlan) {
        return res.status(400).json({ message: "Invalid plan" });
      }
  
      const response = await paystack.post("/transaction/initialize", {
        email: req.user.email,
        amount: selectedPlan.price * 100
      });
  
      await Payment.create({
        landlord: req.user._id,
        plan,
        amount: selectedPlan.price,
        reference: response.data.data.reference
      });
  
      res.json(response.data.data);
  
    } catch (error) {
  
      res.status(500).json({
        message: "Payment initialization failed"
      });
  
    }
  
  };

  const Subscription = require("../subscriptions/subscription.model");

exports.verifyPayment = async (req, res) => {

  try {

    const event = req.body;

    if (event.event === "charge.success") {

      const reference = event.data.reference;

      const payment = await Payment.findOne({ reference });

      if (!payment) return res.sendStatus(200);

      payment.status = "success";
      await payment.save();

      const plan = plans[payment.plan];

      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      await Subscription.create({
        landlord: payment.landlord,
        plan: payment.plan,
        propertyLimit: plan.propertyLimit,
        endDate
      });

    }

    res.sendStatus(200);

  } catch (error) {

    res.sendStatus(500);

  }

};