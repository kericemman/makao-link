const express = require("express");
const router = express.Router();

const auth = require("../../middleware/auth.middleware");
const upload = require("../../utils/upload")



const {
  createProperty,
  getProperties,
  getProperty,
  deleteProperty,
    getMyProperties,
    updateProperty
} = require("./property.controller");

router.get("/", getProperties);


router.get("/my-properties", auth, getMyProperties);

router.get("/:id", getProperty);

router.post("/", auth, createProperty);

router.delete("/:id", auth, deleteProperty);


router.put("/:id", auth, updateProperty);

router.post("/", auth, upload.array("images", 10), createProperty)

module.exports = router;