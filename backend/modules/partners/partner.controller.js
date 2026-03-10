const cloudinary = require("../../config/cloudinary")
const Partner = require("./partner.model")
const mongoose = require("mongoose")
const fs = require("fs")

// Apply as Partner
exports.applyPartner = async (req, res) => {

  try {

    const {
      companyName,
      contactPerson,
      phone,
      email,
      description,
      serviceType
    } = req.body

    // Basic validation
    if (!companyName || !contactPerson || !email || !serviceType) {
      return res.status(400).json({
        message: "Required fields missing"
      })
    }

    let logo = {}
    let documents = []

    // Upload logo
    if (req.files?.logo) {

      const file = req.files.logo[0]

      const uploaded = await cloudinary.uploader.upload(
        file.path,
        { folder: "makaolink/partners/logos" }
      )

      logo = {
        url: uploaded.secure_url,
        public_id: uploaded.public_id
      }

      fs.unlinkSync(file.path)

    }

    // Upload documents
    if (req.files?.documents) {

      for (const file of req.files.documents) {

        const uploaded = await cloudinary.uploader.upload(
          file.path,
          { folder: "makaolink/partners/documents" }
        )

        documents.push({
          url: uploaded.secure_url,
          public_id: uploaded.public_id
        })

        fs.unlinkSync(file.path)

      }

    }

    const partner = await Partner.create({
      companyName,
      contactPerson,
      phone,
      email,
      description,
      serviceType,
      logo,
      documents
    })

    res.status(201).json({
      message: "Application submitted successfully",
      partner
    })

  } catch (error) {

    console.error(error)

    res.status(500).json({
      message: "Partner application failed"
    })

  }

}


// Public: Get Approved Partners
exports.getPartners = async (req, res) => {

  try {

    const partners = await Partner.find({
      isPublished: true,
      status: "approved"
    }).sort({ createdAt: -1 })

    res.json(partners)

  } catch (error) {

    console.error(error)

    res.status(500).json({
      message: "Failed to fetch partners"
    })

  }

}


// Admin: Get Pending Applications
exports.getApplications = async (req, res) => {

  try {

    const partners = await Partner.find({
      status: "pending"
    }).sort({ createdAt: -1 })

    res.json(partners)

  } catch (error) {

    console.error(error)

    res.status(500).json({
      message: "Failed to fetch applications"
    })

  }

}


// Admin: Approve Partner
exports.approvePartner = async (req, res) => {

  try {

    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid partner ID"
      })
    }

    const partner = await Partner.findById(id)

    if (!partner) {
      return res.status(404).json({
        message: "Partner not found"
      })
    }

    partner.status = "approved"
    partner.isPublished = true

    await partner.save()

    res.json({
      message: "Partner approved"
    })

  } catch (error) {

    console.error(error)

    res.status(500).json({
      message: "Approval failed"
    })

  }

}


// Admin: Reject Partner
exports.rejectPartner = async (req, res) => {

  try {

    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid partner ID"
      })
    }

    const partner = await Partner.findById(id)

    if (!partner) {
      return res.status(404).json({
        message: "Partner not found"
      })
    }

    partner.status = "rejected"

    await partner.save()

    res.json({
      message: "Partner rejected"
    })

  } catch (error) {

    console.error(error)

    res.status(500).json({
      message: "Rejection failed"
    })

  }

}