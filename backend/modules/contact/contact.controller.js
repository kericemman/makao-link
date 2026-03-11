const Contact = require("./contact.model")

// Submit contact message
exports.createContact = async (req, res) => {

  const contact = await Contact.create(req.body)

  res.status(201).json({
    message: "Message sent successfully"
  })

}


// Admin: get all messages
exports.getContacts = async (req, res) => {

  const contacts = await Contact.find()
    .sort({ createdAt: -1 })

  res.json(contacts)

}


// Mark message as read
exports.markAsRead = async (req, res) => {

  const contact = await Contact.findById(req.params.id)

  contact.status = "read"

  await contact.save()

  res.json(contact)

}


// Delete message
exports.deleteContact = async (req, res) => {

  await Contact.findByIdAndDelete(req.params.id)

  res.json({
    message: "Message deleted"
  })

}