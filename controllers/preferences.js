const User = require("../models/User");

module.exports = {
  updatePreferences: async (req, res) => {
    try {
      const preferences = req.body;

      await User.findByIdAndUpdate(req.user.id, {
        $set: {
          preferences
        }
      });

      res.sendStatus(200);
    } catch (err) {
      console.log(err);
    }
  },
};
