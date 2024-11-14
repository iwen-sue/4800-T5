const { getDB } = require("../config/database");

const uploadGuest = async (req, res) => {
    res.render("upload-guest.ejs");
}

module.exports = { uploadGuest };