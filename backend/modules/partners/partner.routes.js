// const express = require("express")
// const router = express.Router()

// const auth = require("../../middleware/auth.middleware")
// const role = require("../../middleware/role.middleware")
// const upload = require("../../utils/upload")

// const {
//   applyPartner,
//   getPartners,
//   getApplications,
//   approvePartner,
//   rejectPartner
// } = require("./partner.controller")


// router.post(
//     "/apply",
//     upload.fields([
//       { name: "logo", maxCount: 1 },
//       { name: "documents", maxCount: 5 }
//     ]),
//     applyPartner
//   )

// router.get("/", getPartners)

// router.get("/applications", auth, role("admin"), getApplications)

// router.put("/:id/approve", auth, role("admin"), approvePartner)

// router.put("/:id/reject", auth, role("admin"), rejectPartner)

// module.exports = router