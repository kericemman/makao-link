const PartnerApplication = require("./partnerApplication.model");
const ServicePartner = require("./servicePartner.model");
const paystack = require("../../config/paystack");

const serviceCategories = [
  {
    key: "movers",
    label: "Movers",
    description: "Find trusted moving companies to help you relocate smoothly.",
    image: "https://res.cloudinary.com/dhlz0p70t/image/upload/v1775805955/warehouse-manager-checking-orders-list-coordinating-parcels-packing-process-african-american-woman-supervisor-with-laptop-controlling-freight-cardboard-boxes-sealing-dispatching_ra14rd.jpg"
  },
  {
    key: "cleaning",
    label: "Cleaning Companies",
    description: "Connect with professional cleaners for move-in and move-out cleaning.",
    image: "https://res.cloudinary.com/dhlz0p70t/image/upload/v1775806311/hands-holding-cleaning-tools-solutions_1_xw0sgd.jpg"
  },
  {
    key: "handyman",
    label: "Handyman / Repairs",
    description: "Get help with repairs, fittings, and maintenance work.",
    image: "https://res.cloudinary.com/dhlz0p70t/image/upload/v1775806028/37691_ugndsp.jpg"
  },
  {
    key: "furniture",
    label: "Furniture / Appliances",
    description: "Browse businesses offering furniture and essential home appliances.",
    image: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  },
  {
    key: "internet",
    label: "Internet / WiFi",
    description: "Find providers to set up internet and WiFi for your new home.",
    image: "https://res.cloudinary.com/dhlz0p70t/image/upload/v1775805841/wifi-internet-wireless-connection-communication-technology-graphic_r2njne.jpg"
  }
];



exports.getServiceCategories = async (req, res, next) => {
  try {
    res.json({
      success: true,
      categories: serviceCategories
    });
  } catch (error) {
    next(error);
  }
};

exports.getPartnersByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;

    const validCategories = ["movers", "cleaning", "handyman", "furniture", "internet"];

    if (!validCategories.includes(category)) {
      return res.status(400).json({ message: "Invalid service category" });
    }

    const partners = await ServicePartner.find({
      category,
      isActive: true
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      category,
      partners
    });
  } catch (error) {
    next(error);
  }
};

exports.createPartnerApplication = async (req, res, next) => {
  try {
    const {
      companyName,
      contactPerson,
      email,
      phone,
      category,
      description,
      location,
      website
    } = req.body;

    if (
      !companyName ||
      !contactPerson ||
      !email ||
      !phone ||
      !category ||
      !description ||
      !location
    ) {
      return res.status(400).json({
        message: "All required fields must be provided"
      });
    }

    const validCategories = ["movers", "cleaning", "handyman", "furniture", "internet"];

    if (!validCategories.includes(category)) {
      return res.status(400).json({ message: "Invalid service category" });
    }

    const logo = req.file?.path || req.file?.originalname || "";

    const application = await PartnerApplication.create({
      companyName,
      contactPerson,
      email,
      phone,
      category,
      description,
      location,
      website: website || "",
      logo
    });

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      application
    });
  } catch (error) {
    next(error);
  }
};

exports.initializePartnerApplicationPayment = async (req, res, next) => {
  try {
    const application = await PartnerApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.paymentStatus === "success") {
      return res.status(400).json({ message: "Payment already confirmed for this application" });
    }

    const response = await paystack.post("/transaction/initialize", {
      email: application.email,
      amount: application.amountPaid * 100,
      callback_url: `${process.env.CLIENT_URL}/services/apply/callback`,
      metadata: {
        applicationId: application._id.toString(),
        paymentType: "partner_application",
        category: application.category
      }
    });

    res.json({
      success: true,
      authorization_url: response.data.data.authorization_url
    });
  } catch (error) {
    next(error);
  }
};

exports.getPartnerApplicationStatus = async (req, res, next) => {
  try {
    const application = await PartnerApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    res.json({
      success: true,
      application: {
        _id: application._id,
        companyName: application.companyName,
        category: application.category,
        paymentStatus: application.paymentStatus,
        paymentReference: application.paymentReference,
        status: application.status,
        createdAt: application.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};