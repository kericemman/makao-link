require("dotenv").config();
const mongoose = require("mongoose");

const User = require("../modules/users/user.model");

const MONGO_URI = process.env.MONGO_URI;

const seedAdmin = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");

    const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME, ADMIN_PHONE } = process.env;

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_NAME || !ADMIN_PHONE) {
      throw new Error("ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME and ADMIN_PHONE are required");
    }

    if (ADMIN_PASSWORD.length < 12) {
      throw new Error("ADMIN_PASSWORD must be at least 12 characters long");
    }

    const email = ADMIN_EMAIL;
    const password = ADMIN_PASSWORD;
    const name = ADMIN_NAME;
    const phone = ADMIN_PHONE;

    const existingAdmin = await User.findOne({ email });

    if (existingAdmin) {
      console.log("Admin already exists:", email);
      process.exit(0);
    }

    const admin = await User.create({
      name,
      email,
      password,
      phone,
      role: "admin"
    });

    console.log("Admin created successfully:");
    console.log({
      email: admin.email,
      password,
      phone: admin.phone
    });

    process.exit(0);
  } catch (error) {
    console.error("Failed to seed admin:", error);
    process.exit(1);
  }
};

seedAdmin();
