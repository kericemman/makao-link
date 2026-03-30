require("dotenv").config();
const mongoose = require("mongoose");

const User = require("../modules/users/user.model");

const MONGO_URI = process.env.MONGO_URI;

const seedAdmin = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");

    const email = process.env.ADMIN_EMAIL || "admin@makao.com";
    const password = process.env.ADMIN_PASSWORD || "admin123";
    const name = process.env.ADMIN_NAME || "Super Admin";
    const phone = process.env.ADMIN_PHONE || "0700000000";

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