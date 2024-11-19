const multer = require("multer");

// Use memory storage for temporary file handling
const storage = multer.memoryStorage();

const upload = multer({ storage });

module.exports = upload;

