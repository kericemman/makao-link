const Property = require("./property.model");
const cloudinary = require("../../config/cloudinary");
const Subscription = require("../subscriptions/subscription.model");






exports.createProperty = async (req, res) => {
    const subscription = await Subscription.findOne({
        landlord: req.user._id,
        status: "active"
      });
      
      if (!subscription) {
        return res.status(403).json({ message: "No active subscription" });
      }
      
      const propertyCount = await Property.countDocuments({
        landlord: req.user._id
      });
      
      if (propertyCount >= subscription.propertyLimit) {
        return res.status(403).json({
          message: "Property limit reached for your plan"
        });
      }

    try {
  
      const {
        title,
        description,
        price,
        propertyType,
        bedrooms,
        bathrooms,
        city,
        location,
        amenities
      } = req.body;
  
      const images = [];
  
      if (req.files) {
        for (const file of req.files) {
  
          const uploaded = await cloudinary.uploader.upload(file.path, {
            folder: "makaolink/properties"
          });
  
          images.push({
            url: uploaded.secure_url,
            public_id: uploaded.public_id
          });
        }
      }
  
      const property = await Property.create({
        title,
        description,
        price,
        propertyType,
        bedrooms,
        bathrooms,
        city,
        location,
        amenities,
        images,
        landlord: req.user._id
      });
  
      res.status(201).json(property);
  
    } catch (error) {
      res.status(500).json({ message: "Failed to create property" });
    }
  };


  exports.getProperties = async (req, res) => {

    const { city, bedrooms, minPrice, maxPrice, page = 1 } = req.query;
  
    const limit = 12;
    const skip = (page - 1) * limit;
  
    const filter = { status: "approved" };
  
    if (city) filter.city = city;
    if (bedrooms) filter.bedrooms = bedrooms;
  
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = minPrice;
      if (maxPrice) filter.price.$lte = maxPrice;
    }
  
    const properties = await Property.find(filter)
      .populate("landlord", "name phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  
    res.json(properties);
  };


  exports.getProperty = async (req, res) => {

    const property = await Property.findById(req.params.id)
      .populate("landlord", "name phone email");
  
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }
  
    res.json(property);
  };



  
  exports.deleteProperty = async (req, res) => {

    const property = await Property.findById(req.params.id);
  
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }
  
    if (property.landlord.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }
  
    await property.deleteOne();
  
    res.json({ message: "Property deleted" });
  };


  /// Additional functions for updating properties, managing images, etc. can be added here

  exports.getMyProperties = async (req, res) => {

    try {
  
      const properties = await Property.find({
        landlord: req.user._id
      }).sort({ createdAt: -1 });
  
      res.json(properties);
  
    } catch (error) {
  
      res.status(500).json({
        message: "Failed to fetch properties"
      });
  
    }
  
  };

  exports.updateProperty = async (req, res) => {

    try {
  
      const property = await Property.findById(req.params.id);
  
      if (!property) {
        return res.status(404).json({
          message: "Property not found"
        });
      }
  
      if (property.landlord.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          message: "Unauthorized"
        });
      }
  
      const updated = await Property.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
  
      res.json(updated);
  
    } catch (error) {
  
      res.status(500).json({
        message: "Property update failed"
      });
  
    }
  
  };
