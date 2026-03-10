const User = require("../users/user.model");
const Property = require("../properties/property.model");
const Inquiry = require("../inquiries/inquiry.model");


exports.approveProperty = async (req, res) => {

    const property = await Property.findById(req.params.id);
  
    if (!property) {
      return res.status(404).json({
        message: "Property not found"
      });
    }
  
    property.status = "approved";
  
    await property.save();
  
    res.json({
      message: "Property approved"
    });
  
  };


  exports.getPendingKYC = async (req, res) => {

    const users = await User.find({
      kycStatus: "pending"
    }).select("-password")
  
    res.json(users)
  
  }
  
  // Rejected property
  
  exports.rejectProperty = async (req, res) => {

    const property = await Property.findById(req.params.id);
  
    if (!property) {
      return res.status(404).json({
        message: "Property not found"
      });
    }
  
    property.status = "rejected";
  
    await property.save();
  
    res.json({
      message: "Property rejected"
    });
  
  };

  exports.suspendUser = async (req, res) => {

    const user = await User.findById(req.params.id);
  
    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }
  
    user.isSuspended = true;
  
    await user.save();
  
    res.json({
      message: "User suspended"
    });
  
  };



  exports.approveKYC = async (req, res) => {

    const user = await User.findById(req.params.id);
  
    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }
  
    user.kycStatus = "approved";
  
    await user.save();
  
    res.json({
      message: "KYC approved"
    });
  
  };

  exports.getAllUsers = async (req, res) => {
    try {
  
      const users = await User.find().select("-password");
  
      res.json(users);
  
    } catch (error) {
  
      res.status(500).json({
        message: "Failed to fetch users"
      });
  
    }
  };

  exports.activateUser = async (req, res) => {

    const user = await User.findById(req.params.id)
  
    if (!user) {
      return res.status(404).json({
        message: "User not found"
      })
    }
  
    user.isSuspended = false
  
    await user.save()
  
    res.json({
      message: "User activated"
    })
  
  }


  exports.getDashboardStats = async (req, res) => {

    const totalUsers = await User.countDocuments();
  
    const totalProperties = await Property.countDocuments();
  
    const pendingProperties = await Property.countDocuments({
      status: "pending"
    });
  
    const totalInquiries = await Inquiry.countDocuments();
  
    res.json({
      totalUsers,
      totalProperties,
      pendingProperties,
      totalInquiries,
    });
  
  };


  exports.getAdminActivity = async (req, res) => {
    try {
  
      const limit = parseInt(req.query.limit) || 10;
  
      const activities = await Property.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("landlord", "name");
  
      res.json(activities);
  
    } catch (error) {
  
      console.error(error);
  
      res.status(500).json({
        message: "Failed to fetch admin activity"
      });
  
    }
  };

  exports.getRevenueChart = async (req, res) => {
    try {
  
      const period = req.query.period || "week";
  
      // temporary mock data
      const data = [
        { day: "Mon", revenue: 120 },
        { day: "Tue", revenue: 200 },
        { day: "Wed", revenue: 150 },
        { day: "Thu", revenue: 300 },
        { day: "Fri", revenue: 250 },
        { day: "Sat", revenue: 400 },
        { day: "Sun", revenue: 350 }
      ];
  
      res.json(data);
  
    } catch (error) {
  
      console.error(error);
  
      res.status(500).json({
        message: "Failed to load revenue chart"
      });
  
    }
  };