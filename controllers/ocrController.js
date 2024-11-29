//ocrController.js
const { ocrSpace } = require('ocr-space-api-wrapper');

const extractTextFromImageAndPDF = async (req, res) => {
    const fileId = req.params.id;
    const { getGFS } = require('../config/database'); // Assuming you're using GridFS for file storage
    const { ObjectId } = require('mongodb');
    const gfs = getGFS();

    try {
        // Fetch the file from GridFS
        const chunks = [];
        const stream = gfs.openDownloadStream(new ObjectId(fileId));

        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', async () => {
            const buffer = Buffer.concat(chunks);

            console.log('File type-ocrController:', req.query.fileType);
            
            let base64File;
            const fileType = req.query.fileType || 'image'; // Pass the file type if available

            console.log('File type received in ocrController:', fileType); // Add this log


            // Convert buffer to base64 for OCR API
            if (fileType === 'application/pdf') {
                base64File = `data:application/pdf;base64,${buffer.toString('base64')}`;
            } else {
                base64File = `data:image/png;base64,${buffer.toString('base64')}`;
            }

            console.log('Sending base64 file to OCR API:', base64File);
            console.log('File type:', fileType);

            try {
                // Call ocr.space API
                const result = await ocrSpace(base64File, {
                    apiKey: process.env.OCR_API_KEY, // Use the API key from the environment variable
                    language: 'eng', // Specify the language
                    isOverlayRequired: false,
                });

                // Extract the text from the OCR result
                const parsedText = result?.ParsedResults[0]?.ParsedText;

                if (parsedText) {
                    res.json({ success: true, text: parsedText });
                } else {
                    res.status(500).json({ success: false, message: 'Failed to extract text' });
                }
            } catch (ocrError) {
                console.error('Error during OCR processing:', ocrError);
                res.status(500).json({ success: false, message: 'OCR API call failed' });
            }
        });

        stream.on('error', (streamError) => {
            console.error('Error fetching file for OCR:', streamError);
            res.status(500).json({ success: false, message: 'Failed to fetch file for OCR' });
        });
    } catch (error) {
        console.error('Error in OCR processing:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = {
    extractTextFromImageAndPDF,
};
