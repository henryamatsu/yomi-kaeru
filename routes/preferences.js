const express = require("express");
const router = express.Router();
const preferencesController = require("../controllers/preferences");

router.put("/", preferencesController.updatePreferences);
module.exports = router;
