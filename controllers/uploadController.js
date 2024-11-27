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
            uploadDate: new Date(),
            // Set the expiration
            expireAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days TTL
        });
        console.log("successfully uploaded text")
        res.redirect('/upload?successMessage=Text uploaded successfully!');
    } catch (error) {
        console.error('Error uploading text:', error);
        res.redirect('/upload?errorMessage=Failed to upload text.');
    }
};


// Upload file to GridFS
const uploadFiles = async (req, res) => {
    const gfs = getGFS();
    const db = getDB();
    const email = req.user.email; // Ensure the user is authenticated

    if (!req.files || req.files.length === 0) {
        return res.status(400).send("No files uploaded");
    }

    try {
        const uploadPromises = req.files.map((file) => {
            const fileType = file.mimetype;


            // Determine the category based on file MIME type
            let category;
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

             // Create an upload stream for each file
             return new Promise((resolve, reject) => {
                const fileStream = gfs.openUploadStream(file.originalname, {
                    contentType: file.mimetype,
                    metadata: {
                        email,
                        category,
                        // Set the expiration
                        expireAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days TTL
                    },
                });

                fileStream.end(file.buffer);
                fileStream.on("finish", resolve);
                fileStream.on("error", reject);
            });
        });

        // Wait for all files to be uploaded
        await Promise.all(uploadPromises);

        res.redirect('/upload?successMessage=Files uploaded successfully!');

    } catch (error) {
        console.error("Error uploading files to GridFS:", error);
        res.status(500).send("Upload failed");
    }
};

const uploadGuest = async (req, res) => {
    res.render("upload-guest.ejs");
}

module.exports = {
    upload,
    uploadFiles,
    uploadText,
    uploadGuest
};