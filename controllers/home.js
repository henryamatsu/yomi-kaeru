const User = require("../models/User");

module.exports = {
  getIndex: (req, res) => {
    res.render("index.ejs");
  },
  getProfile: async (req, res) => {
    const user = await User.findById(req.user._id);
    const preferences = user.preferences;
    res.render("profile.ejs", {
      preferences
    });
  }
};
