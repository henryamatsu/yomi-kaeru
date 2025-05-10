const express = require("express");
const router = express.Router();
const preferencesController = require("../controllers/preferences");
const { ensureAuth, ensureGuest } = require("../middleware/auth");

// router.get("/getPreferences", ensureAuth, preferencesController.getPreferences);
router.put("/", preferencesController.updatePreferences);
module.exports = router;
