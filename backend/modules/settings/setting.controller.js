const Settings = require("./setting.model")

// Get settings
exports.getSettings = async (req, res) => {

  let settings = await Settings.findOne()

  if (!settings) {
    settings = await Settings.create({})
  }

  res.json(settings)

}


// Update settings
exports.updateSettings = async (req, res) => {

  let settings = await Settings.findOne()

  if (!settings) {
    settings = await Settings.create({})
  }

  Object.assign(settings, req.body)

  await settings.save()

  res.json({
    message: "Settings updated",
    settings
  })

}