const jwt = require("jsonwebtoken");
const User = require("../users/user.model");

exports.generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

exports.findUserByEmail = async (email) => {
  return await User.findOne({ email });
};

exports.createUser = async (data) => {
  const user = new User(data);
  return await user.save();
};