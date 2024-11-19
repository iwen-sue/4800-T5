const multer = require('multer');
const { getDB, getGFS } = require('../config/database');
const upload = require("../config/multer"); 


// Function to upload text to the texts collection
const uploadText = async (req, res) => {
    const db = getDB();

    // Check if user is authenticated
    if (!req.user || !req.user.email) {
        return res.status(401).send('You must be logged in to upload content.');
    }

    const { text } = req.body;
    const email = req.user.email;

    // Validate input
    if (!text) {
        return res.status(400).send('Text content is required.');
    }

    try {
        // Insert text into the texts collection
        await db.collection('texts').insertOne({
            email,
            text,
            uploadDate: new Date()
        });
        console.log("successfully uploaded text")
        res.redirect('/upload');
    } catch (error) {
        console.error('Error uploading text:', error);
        res.status(500).send('Failed to upload text.');
    }
};


// Upload file to GridFS
const uploadFile = async (req, res) => {
    const gfs = getGFS();
    const db = getDB();
    const email = req.user.email; // Ensure the user is authenticated

    if (!req.file) {
        return res.status(400).send("No file uploaded");
    }

    // Determine the category based on file MIME type
    const fileType = req.file.mimetype;

    if (fileType.startsWith("image/")) {
        category = "image";
    } else if (fileType === "application/pdf") {
        category = "document";
    } else if (fileType.startsWith("application/vnd.openxmlformats-officedocument")) {
        category = "office-document";
    } else if (fileType === "application/vnd.ms-excel" || fileType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
        category = "spreadsheet"; // Excel files
    } else if (fileType.startsWith("text/")) {
        category = "text-file";
    } else if (fileType.startsWith("application/zip") || fileType === "application/x-rar-compressed") {
        category = "archive"; // Zip, RAR, etc.
    } else if (fileType === "application/json") {
        category = "json-file";
    } else if (fileType.startsWith("application/xml")) {
        category = "xml-file";
    } else {
        category = "other"; // Default fallback
    }

    try {
        const fileStream = gfs.openUploadStream(req.file.originalname, {
            contentType: req.file.mimetype,
            metadata: {
                email,
                category, 
            },
        });

        // Write the file buffer to GridFS
        fileStream.end(req.file.buffer);

        fileStream.on("finish", () => {
            console.log("Successfully uploaded file with category:", category);
            res.redirect("/upload");
        });

        fileStream.on("error", (err) => {
            console.error("Error uploading file:", err);
            res.status(500).send("Failed to upload file");
        });
    } catch (error) {
        console.error("Error uploading to GridFS:", error);
        res.status(500).send("Upload failed");
    }
};


const uploadGuest = async (req, res) => {
    res.render("upload-guest.ejs");
}

module.exports = {
    upload,
    uploadFile,
    uploadText,
    uploadGuest
};