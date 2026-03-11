const Ticket = require("./ticket.model")
const sendEmail = require("../../utils/sendEmail")

// Landlord creates ticket
exports.createTicket = async (req, res) => {

    const {
      subject,
      message,
      category,
      priority
    } = req.body
  
    const ticket = await Ticket.create({
      landlord: req.user._id,
      subject,
      message,
      category,
      priority
    })
  
    res.status(201).json(ticket)
  
  }


// Landlord tickets
exports.getMyTickets = async (req, res) => {

  const tickets = await Ticket.find({
    landlord: req.user._id
  }).sort({ createdAt: -1 })

  res.json(tickets)

}


// Admin gets all tickets
exports.getTickets = async (req, res) => {

  const tickets = await Ticket.find()
    .populate("landlord", "name email")
    .sort({ createdAt: -1 })

  res.json(tickets)

}


// Get single ticket
exports.getTicket = async (req, res) => {

  const ticket = await Ticket.findById(req.params.id)
    .populate("landlord", "name email")

  res.json(ticket)

}


// Admin reply
exports.replyTicket = async (req, res) => {

  const ticket = await Ticket.findById(req.params.id)
    .populate("landlord")

  ticket.replies.push({
    sender: "admin",
    message: req.body.message
  })

  await ticket.save()

  // Email notification
  await sendEmail({
    to: ticket.landlord.email,
    subject: "MakaoLink Support Reply",
    text: req.body.message
  })

  res.json(ticket)

}


// Close ticket
exports.closeTicket = async (req, res) => {

  const ticket = await Ticket.findById(req.params.id)

  ticket.status = "closed"

  await ticket.save()

  res.json(ticket)

}