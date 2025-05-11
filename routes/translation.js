const express = require("express");
const router = express.Router();
const translationController = require("../controllers/translation");

router.get("/", translationController.translate);
module.exports = router;
