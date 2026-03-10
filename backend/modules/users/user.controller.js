const User = require("./user.model");

exports.updateProfile = async (req, res) => {

  try {

    const { name, phone, email } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (email) user.email = email;

    await user.save();

    res.json({
      message: "Profile updated",
      user
    });

  } catch (error) {

    res.status(500).json({
      message: "Profile update failed"
    });

  }

};