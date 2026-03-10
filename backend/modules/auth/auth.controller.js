const validator = require("validator");
const User = require("../users/user.model");
const crypto = require("crypto");
const sendEmail = require("../../utils/sendEmail");
const {
  generateToken,
  findUserByEmail,
  createUser
} = require("./auth.service");

exports.register = async (req, res) => {
  try {

    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Invalid email" });
    }

    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await createUser({
      name,
      email,
      phone,
      password,
      role: "landlord"
    });

    const token = generateToken(user._id);

    res.status(201).json({
      message: "Registration successful",
      token,
      user
    });

  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

// For simplicity, the login function is not implemented here. It would involve verifying the user's credentials and generating a token if valid.

exports.login = async (req, res) => {
    try {
  
      const { email, password } = req.body;
  
      const user = await findUserByEmail(email);
  
      if (!user) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
  
      const isMatch = await user.comparePassword(password);
  
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
  
      const token = generateToken(user._id);
  
      res.json({
        message: "Login successful",
        token,
        user
      });
  
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  };


  // forgot password

  exports.forgotPassword = async (req, res) => {

    try {
  
      const { email } = req.body;
  
      const user = await User.findOne({ email });
  
      if (!user) {
        return res.status(404).json({
          message: "User not found"
        });
      }
  
      const resetToken = user.createPasswordResetToken();
  
      await user.save({ validateBeforeSave: false });
  
      const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  
      const message = `
        <h2>Password Reset</h2>
        <p>You requested to reset your password.</p>
        <p>Click the link below:</p>
        <a href="${resetURL}">${resetURL}</a>
        <p>This link expires in 10 minutes.</p>
      `;
  
      await sendEmail(
        user.email,
        "Reset your password",
        message
      );
  
      res.json({
        message: "Password reset link sent to email"
      });
  
    } catch (error) {
  
      res.status(500).json({
        message: "Error sending reset email"
      });
  
    }
  
  };


  exports.resetPassword = async (req, res) => {

    try {
  
      const hashedToken = crypto
        .createHash("sha256")
        .update(req.params.token)
        .digest("hex");
  
      const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
      });
  
      if (!user) {
        return res.status(400).json({
          message: "Token invalid or expired"
        });
      }
  
      user.password = req.body.password;
  
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
  
      await user.save();
  
      res.json({
        message: "Password reset successful"
      });
  
    } catch (error) {
  
      res.status(500).json({
        message: "Password reset failed"
      });
  
    }
  
  };

// get current user

exports.getCurrentUser = async (req, res) => {

    try {
  
      const user = await User.findById(req.user._id)
        .select("-password");
  
      res.json(user);
  
    } catch (error) {
  
      res.status(500).json({
        message: "Failed to fetch user"
      });
  
    }
  
  };