const SupportTicket = require("./support.model");
const User = require("../users/user.model");
const sendEmail = require("../../utils/sendEmail");
const { supportReplyEmail } = require("../../utils/emailTemplates");


// landlord creates ticket
exports.createTicket = async (req, res, next) => {
  try {
    const { subject, category, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ message: "Subject and message are required" });
    }

    const ticket = await SupportTicket.create({
      landlord: req.user._id,
      subject,
      category: category || "other",
      status: "open",
      messages: [
        {
          senderRole: "landlord",
          sender: req.user._id,
          message
        }
      ],
      lastReplyAt: new Date()
    });

    res.status(201).json({
      success: true,
      message: "Support ticket created successfully",
      ticket
    });
  } catch (error) {
    next(error);
  }
};

// landlord gets own tickets
exports.getMyTickets = async (req, res, next) => {
  try {
    const tickets = await SupportTicket.find({ landlord: req.user._id })
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      tickets
    });
  } catch (error) {
    next(error);
  }
};

// landlord gets one own ticket
exports.getMyTicketById = async (req, res, next) => {
  try {
    const ticket = await SupportTicket.findOne({
      _id: req.params.id,
      landlord: req.user._id
    })
      .populate("landlord", "name email phone")
      .populate("messages.sender", "name email role");

    if (!ticket) {
      return res.status(404).json({ message: "Support ticket not found" });
    }

    res.json({
      success: true,
      ticket
    });
  } catch (error) {
    next(error);
  }
};

// landlord follow-up reply
exports.replyToMyTicket = async (req, res, next) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Reply message is required" });
    }

    const ticket = await SupportTicket.findOne({
      _id: req.params.id,
      landlord: req.user._id
    });

    if (!ticket) {
      return res.status(404).json({ message: "Support ticket not found" });
    }

    if (ticket.status === "closed") {
      return res.status(400).json({ message: "This ticket is closed" });
    }

    ticket.messages.push({
      senderRole: "landlord",
      sender: req.user._id,
      message
    });

    if (ticket.status === "resolved") {
      ticket.status = "in_progress";
    }

    ticket.lastReplyAt = new Date();
    await ticket.save();

    const populatedTicket = await SupportTicket.findById(ticket._id)
      .populate("landlord", "name email phone")
      .populate("messages.sender", "name email role");

    res.json({
      success: true,
      message: "Reply sent successfully",
      ticket: populatedTicket
    });
  } catch (error) {
    next(error);
  }
};

// admin gets all tickets
exports.getAdminTickets = async (req, res, next) => {
  try {
    const { status } = req.query;

    const filter = {};
    if (status && ["open", "in_progress", "resolved", "closed"].includes(status)) {
      filter.status = status;
    }

    const tickets = await SupportTicket.find(filter)
      .populate("landlord", "name email phone")
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      tickets
    });
  } catch (error) {
    next(error);
  }
};

// admin gets one ticket
exports.getAdminTicketById = async (req, res, next) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate("landlord", "name email phone")
      .populate("messages.sender", "name email role");

    if (!ticket) {
      return res.status(404).json({ message: "Support ticket not found" });
    }

    res.json({
      success: true,
      ticket
    });
  } catch (error) {
    next(error);
  }
};

// admin reply to ticket
exports.replyAsAdmin = async (req, res, next) => {
  try {
    const { message, status } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Reply message is required" });
    }

    const ticket = await SupportTicket.findById(req.params.id).populate("landlord", "name email");

    if (!ticket) {
      return res.status(404).json({ message: "Support ticket not found" });
    }

    ticket.messages.push({
      senderRole: "admin",
      sender: req.user._id,
      message
    });

    if (status && ["open", "in_progress", "resolved", "closed"].includes(status)) {
      ticket.status = status;
    } else if (ticket.status === "open") {
      ticket.status = "in_progress";
    }

    ticket.lastReplyAt = new Date();
    await ticket.save();

    await sendEmail({
        to: ticket.landlord.email,
        subject: `Update on your support ticket: ${ticket.subject}`,
        html: supportReplyEmail({
          name: ticket.landlord.name,
          subject: ticket.subject,
          reply: message
        })
      });

    const populatedTicket = await SupportTicket.findById(ticket._id)
      .populate("landlord", "name email phone")
      .populate("messages.sender", "name email role");

    res.json({
      success: true,
      message: "Reply sent successfully",
      ticket: populatedTicket
    });
  } catch (error) {
    next(error);
  }
};

// admin updates ticket status only
exports.updateTicketStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!["open", "in_progress", "resolved", "closed"].includes(status)) {
      return res.status(400).json({ message: "Invalid ticket status" });
    }

    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { status, lastReplyAt: new Date() },
      { new: true }
    )
      .populate("landlord", "name email phone")
      .populate("messages.sender", "name email role");

    if (!ticket) {
      return res.status(404).json({ message: "Support ticket not found" });
    }

    res.json({
      success: true,
      message: "Ticket status updated",
      ticket
    });
  } catch (error) {
    next(error);
  }
};