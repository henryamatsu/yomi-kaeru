const User = require("../models/User");

module.exports = {
  // getPreferences: async (req, res) => {
  //   try {
  //     const user = await User.findById(req.user.id).lean();
  //     res.json(user.preferences);
  //   } catch (err) {
  //     console.log(err);
  //   }
  // }, We probably don't need this path, because we just get a user's preferences when we populate their profile page
  updatePreferences: async (req, res) => {
    try {
      const preferences = req.body;

      console.log(req.user.id)

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
