const Tesseract = require('tesseract.js');
const { getGFS } = require('../config/database');
const { ObjectId } = require('mongodb');

const processImageToText = async (req, res) => {
    const gfs = getGFS();
    const fileId = req.params.id;

    try {
        // Fetch the image from GridFS
        const chunks = [];
        const stream = gfs.openDownloadStream(new ObjectId(fileId));

        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', async () => {
            const buffer = Buffer.concat(chunks);

            // Perform OCR using Tesseract.js
            Tesseract.recognize(buffer, 'eng')
                .then(({ data: { text } }) => {
                    res.json({ success: true, text }); // Send extracted text
                })
                .catch((error) => {
                    console.error('OCR processing failed:', error);
                    res.json({ success: false, message: 'Failed to extract text.' });
                });
        });

        stream.on('error', (error) => {
            console.error('Error fetching file:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch image for OCR.' });
        });
    } catch (error) {
        console.error('Error in OCR processing:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

module.exports = {
    processImageToText,
};
