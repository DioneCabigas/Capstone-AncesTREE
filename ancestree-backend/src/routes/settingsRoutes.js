const express = require("express");
const router = express.Router();
const settingsController = require("../controllers/settingsController");

router.get("/user/:uid", settingsController.getSettings);
router.post("/user", settingsController.saveSettings);

module.exports = router;