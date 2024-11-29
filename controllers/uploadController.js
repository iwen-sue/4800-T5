const multer = require('multer');
const storage = multer.memoryStorage();
const { getDB, getGFS } = require('../config/database');
const upload = require("../config/multer");


// Function to upload text to the texts collection
const uploadText = async (req, res) => {
    console.log('Request User:', req.user); // Debugging

    const db = getDB();
    const { text } = req.body;

    // Validate input
    if (!text) {
        return res.status(400).send('Text content is required.');
    }

    // Use email for authenticated users; use "passcode" for guests
    const emailOrPasscode = req.user && req.user.email ? req.user.email : "passcode";


    // Set expiration based on authentication status
    const expireInMs = req.user && req.user.email
        ? 7 * 24 * 60 * 60 * 1000 // 7 days for authenticated users
        : 23 * 60 * 60 * 1000;   // 23 hours for unauthenticated users (less than the token expiration time)


    try {
        // Insert text into the texts collection
        await db.collection('texts').insertOne({
            email: emailOrPasscode,
            text,
            uploadDate: new Date(),
            expireAt: new Date(Date.now() + expireInMs) // Dynamic TTL
        });
        console.log("successfully uploaded text")

        const redirectTo = req.user ? '/upload' : '/upload-guest';
        res.redirect(`${redirectTo}?successMessage=Text uploaded successfully!`);

    } catch (error) {
        console.error('Error uploading text:', error);
        res.redirect(`${redirectTo}?errorMessage=Failed to upload text.!`);
    }
};


// Upload file to GridFS
const uploadFiles = async (req, res) => {
    const gfs = getGFS();
    const db = getDB();

    if (!req.files || req.files.length === 0) {
        return res.status(400).send("No files uploaded");
    }
   
    // Use email for authenticated users; use "passcode" for guests
    const emailOrPasscode = req.user && req.user.email ? req.user.email : "passcode";

    // Set expiration based on authentication status
    const expireInMs = req.user && req.user.email
    ? 7 * 24 * 60 * 60 * 1000 // 7 days for authenticated users
    : 23 * 60 * 60 * 1000;   // 23 hours for unauthenticated users (less than the token expiration time)


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
                        email: emailOrPasscode,
                        category,
                        expireAt: new Date(Date.now() + expireInMs) // Dynamic TTL
                    },
                });

                fileStream.end(file.buffer);
                fileStream.on("finish", () => resolve());
                fileStream.on("error", (err) => {
                    console.error(`Error uploading file: ${file.originalname}`, err);
                    reject(err);
                });
            });
        });

        // Wait for all files to be uploaded
        await Promise.all(uploadPromises);

        const redirectTo = req.user ? '/upload' : '/upload-guest';
        res.redirect(`${redirectTo}?successMessage=Files uploaded successfully!`);

    } catch (error) {
        console.error('Error uploading text:', error);
        res.redirect(`${redirectTo}?errorMessage=Failed to upload files.!`);
    }
};


module.exports = {
    upload,
    uploadFiles,
    uploadText,
};