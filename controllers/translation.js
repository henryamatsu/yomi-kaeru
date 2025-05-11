const gemini = require("../utils/gemini");

module.exports = {
  translate: async (req, res) => {
    try {
      const translation = await gemini.run(req.body);

      res.json(translation);
    } catch (err) {
      console.log(err);
    }
  },
};
