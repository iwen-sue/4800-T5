const multer = require('multer');
const { getDB, getGFS } = require('../config/database');
// const sharp = require('sharp');

// Multer setup to store files in memory
const storage = multer.memoryStorage();
const upload = multer({ storage });


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
        return res.status(400).send('No file uploaded');
    }

    // Initialize variables
    let description = req.body.description || '';
    let category = '';

    // Automatically set category based on the file type
    const fileType = req.file.mimetype;
    if (fileType.startsWith('image/')) {
        category = 'image';
    } else if (fileType === 'application/pdf') {
        category = 'document';
    } else {
        return res.status(400).send('Unsupported file type');
    }


  

    try {
        const fileStream = gfs.openUploadStream(req.file.originalname, {
            contentType: req.file.mimetype,
            metadata: {
                email,
                description,
                category
            }
        });

        // Write the file buffer to GridFS
        fileStream.end(req.file.buffer);

        fileStream.on('finish', () => {
            console.log("successfully uploaded")
            res.redirect('/upload');

        });

        fileStream.on('error', (err) => {
            console.error('Error uploading file:', err);
            res.status(500).send('Failed to upload file');
        });
    } catch (error) {
        console.error('Error uploading to GridFS:', error);
        res.status(500).send('Upload failed');
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