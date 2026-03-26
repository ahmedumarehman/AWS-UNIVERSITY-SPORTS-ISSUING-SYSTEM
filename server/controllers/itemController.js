const items = require("../data/items.json");

const getItems = (req, res) => {
  res.status(200).json(items);
};

module.exports = { getItems };