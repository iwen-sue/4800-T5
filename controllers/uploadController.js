const multer = require('multer');
const storage = multer.memoryStorage();
const { getDB, getGFS } = require('../config/database');
const upload = require("../config/multer");


// Function to upload both text and file
const uploadCombined = async (req, res) => {
    const db = getDB();
    const gfs = getGFS();

    const { text } = req.body; // Retrieve text input
    const files = req.files; // Retrieve files
    const emailOrPasscode = req.user && req.user.email ? req.user.email : "passcode";

    // Set expiration based on authentication status
    const expireInMs = req.user && req.user.email
        ? 7 * 24 * 60 * 60 * 1000 // 7 days for authenticated users
        : 23 * 60 * 60 * 1000;   // 23 hours for guest users

    try {
        // Process text upload if text is provided
        if (text && text.trim() !== "") {
            await db.collection('texts').insertOne({
                email: emailOrPasscode,
                text,
                uploadDate: new Date(),
                expireAt: new Date(Date.now() + expireInMs),
            });
            console.log("Text uploaded successfully");
        }

        // Process file uploads if files are provided
        if (files && files.length > 0) {
            const uploadPromises = files.map((file) => {
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
                    category = "spreadsheet";
                } else if (fileType.startsWith("text/")) {
                    category = "text-file";
                } else if (fileType.startsWith("application/zip") || fileType === "application/x-rar-compressed") {
                    category = "archive";
                } else if (fileType === "application/json") {
                    category = "json-file";
                } else if (fileType.startsWith("application/xml")) {
                    category = "xml-file";
                } else {
                    category = "other";
                }

                return new Promise((resolve, reject) => {
                    const fileStream = gfs.openUploadStream(file.originalname, {
                        contentType: file.mimetype,
                        metadata: {
                            email: emailOrPasscode,
                            category,
                            expireAt: new Date(Date.now() + expireInMs),
                        },
                    });

                    fileStream.end(file.buffer);
                    fileStream.on("finish", resolve);
                    fileStream.on("error", reject);
                });
            });

            await Promise.all(uploadPromises);
            console.log("Files uploaded successfully");
        }

        // Redirect based on user type
        const redirectTo = req.user ? '/upload' : '/upload-guest';
        res.redirect(`${redirectTo}?successMessage=Upload successful!`);

    } catch (error) {
        console.error("Error during combined upload:", error);
        const redirectTo = req.user ? '/upload' : '/upload-guest';
        res.redirect(`${redirectTo}?errorMessage=Upload failed.`);
    }
};

module.exports = {
    upload,
    uploadCombined,
};