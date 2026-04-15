const ContactMessage = require("./contact.model");
const sendEmail = require("../../utils/sendEmail");

exports.createContactMessage = async (req, res, next) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !phone || !subject || !message) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    const contactMessage = await ContactMessage.create({
      name,
      email,
      phone,
      subject,
      message
    });

    if (process.env.ADMIN_EMAIL) {
      await sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: `New Contact Message: ${subject}`,
        html: `
          <h2>New Contact Message</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <p>${message}</p>
        `
      });
    }

    await sendEmail({
      to: email,
      subject: "We received your message",
      html: `
        <h2>Thanks for contacting RendaHomes</h2>
        <p>Hello ${name},</p>
        <p>We have received your message and our team will get back to you soon.</p>
        <p><strong>Subject:</strong> ${subject}</p>
      `
    });

    res.status(201).json({
      success: true,
      message: "Your message has been sent successfully",
      contactMessage
    });
  } catch (error) {
    next(error);
  }
};

exports.getAdminContactMessages = async (req, res, next) => {
  try {
    const { status } = req.query;

    const filter = {};
    if (status && ["new", "in_progress", "resolved"].includes(status)) {
      filter.status = status;
    }

    const messages = await ContactMessage.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      messages
    });
  } catch (error) {
    next(error);
  }
};

exports.getAdminContactMessageById = async (req, res, next) => {
  try {
    const message = await ContactMessage.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        message: "Contact message not found"
      });
    }

    res.json({
      success: true,
      message
    });
  } catch (error) {
    next(error);
  }
};

exports.updateContactMessageStatus = async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;

    if (!["new", "in_progress", "resolved"].includes(status)) {
      return res.status(400).json({
        message: "Invalid status"
      });
    }

    const message = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      {
        status,
        ...(typeof adminNotes === "string" ? { adminNotes } : {})
      },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({
        message: "Contact message not found"
      });
    }

    res.json({
      success: true,
      message: "Contact message updated successfully",
      contactMessage: message
    });
  } catch (error) {
    next(error);
  }
};