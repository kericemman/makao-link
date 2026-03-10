const Inquiry = require("./inquiry.model");
const Property = require("../properties/property.model");
const sendEmail = require("../../utils/sendEmail");

exports.createInquiry = async (req, res) => {

    try {
  
      const { propertyId, name, phone, email, message } = req.body;
  
      const property = await Property.findById(propertyId)
        .populate("landlord");
  
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
  
      const inquiry = await Inquiry.create({
        property: propertyId,
        landlord: property.landlord._id,
        name,
        phone,
        email,
        message
      });
  
      const emailContent = `
        <h2>New MakaoLink Inquiry</h2>
        <p><strong>Property:</strong> ${property.title}</p>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Email:</strong> ${email || "N/A"}</p>
        <p><strong>Message:</strong> ${message}</p>
      `;
  
      await sendEmail(
        property.landlord.email,
        "New Property Inquiry",
        emailContent
      );
  
      res.status(201).json({
        message: "Inquiry sent successfully",
        inquiry
      });
  
    } catch (error) {
  
      res.status(500).json({
        message: "Failed to send inquiry"
      });
  
    }
  
  };

  
  exports.getMyInquiries = async (req, res) => {

    try {
  
      const inquiries = await Inquiry.find({
        landlord: req.user._id
      })
      .populate("property", "title location price")
      .sort({ createdAt: -1 });
  
      res.json(inquiries);
  
    } catch (error) {
  
      res.status(500).json({
        message: "Failed to fetch inquiries"
      });
  
    }
  
  };