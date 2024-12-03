// downloadController.js
const { getDB, getGFS } = require('../config/database');
const { ObjectId } = require('mongodb');

const Canvas = require('canvas');
const { createCanvas } = Canvas;
// const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.mjs');
const sharp = require('sharp');
const path = require('path');


// Function to get the list of texts for the user
const listTexts = async ({ key, value }) => {
    const db = getDB();

    try {
        // Create dynamic query object
        const query = { [key]: value };
        const texts = await db.collection('texts').find(query).toArray();
        return texts;
    } catch (error) {
        console.error('Error fetching texts:', error);
        throw new Error('Failed to load texts.');
    }
};

// Function to download a file by its ID
const downloadFile = async (req, res) => {
    const gfs = getGFS();
    const fileId = req.params.id;

    try {
        // Convert fileId to an ObjectId before querying
        const file = await gfs.find({ _id: new ObjectId(fileId) }).toArray();
        if (!file || file.length === 0) {
            return res.status(404).send('File not found');
        }

        // Set headers for file download
        res.set('Content-Type', file[0].contentType);
        res.set('Content-Disposition', `attachment; filename="${file[0].filename}"`);

        // Pipe the file stream to the response
        gfs.openDownloadStream(new ObjectId(fileId)).pipe(res);

        console.log("Requested file ID:", fileId);
        // console.log("Files in DB:", await gfs.find().toArray());

    } catch (error) {
        console.error('Error downloading file:', error);
        res.status(500).send('Download failed');
    }
};

// Helper function to determine search criteria
const getSearchCriteria = (user) => {
    if (user._id) {
        return { key: 'email', value: user.email };
    } else if (user.phone) {
        return { key: 'phone', value: user.phone };
    }
    return { key: 'email', value: user.email };
};

const renderDownloadPage = async (req, res) => {
    try {
        console.log("User info on download page:", req.user);

        // Determine search key and value based on user type
        const searchCriteria = getSearchCriteria(req.user);
        
        const texts = await listTexts(searchCriteria);
        const files = await listFiles(searchCriteria);

        // Prepare render options
        const renderOptions = {
            texts,
            files,
            ...(req.user._id ? { user: req.user } : {}),
            ...(req.user.phone ? { isGuest: true } : {})
        };

        res.render('download', renderOptions);

    } catch (error) {
        console.error('Error loading content:', error);
        res.status(500).send('Failed to load content');
    }
};

const deleteText = async (req, res) => {
    const db = getDB();
    const textId = req.params.id;

    try {
        await db.collection('texts').deleteOne({ _id: new ObjectId(textId) });
        res.redirect('/download'); // Redirect back to download page
    } catch (error) {
        console.error('Error deleting text:', error);
        res.status(500).send('Failed to delete text');
    }
};

const deleteFile = async (req, res) => {
    const gfs = getGFS();
    const fileId = req.params.id;

    try {
        // Remove file metadata and chunks from GridFS
        await gfs.delete(new ObjectId(fileId));
        res.redirect('/download'); // Redirect back to download page
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).send('Failed to delete file');
    }
};


// Add this new function to generate thumbnails for images and PDFs
const generateThumbnail = async (buffer, fileType) => {
    // For images
    if (fileType.startsWith('image/')) {
        return await sharp(buffer)
            .resize(100, 100, {
                fit: 'contain',
                background: { r: 255, g: 255, b: 255, alpha: 1 }
            })
            .toBuffer();
    }


    // For PDFs
    if (fileType === 'application/pdf') {
        try {
            const data = new Uint8Array(buffer);
            const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
            const pdfDocument = await pdfjsLib.getDocument({ data }).promise;
            const page = await pdfDocument.getPage(1);
            const viewport = page.getViewport({ scale: 1.0 });
            const scale = 100 / Math.max(viewport.width, viewport.height);
            const scaledViewport = page.getViewport({ scale });
            const canvas = createCanvas(100, 100);
            const context = canvas.getContext('2d');

            context.fillStyle = 'white';
            context.fillRect(0, 0, 100, 100);

            await page.render({
                canvasContext: context,
                viewport: scaledViewport,
                transform: [1, 0, 0, 1, (100 - scaledViewport.width) / 2, (100 - scaledViewport.height) / 2]
            }).promise;

            return canvas.toBuffer('image/png');
        } catch (error) {
            console.error('Error generating PDF thumbnail:', error);
            return null;
        }
    }

    return null;
};


// Modify the existing listFiles function to include thumbnail URLs
const listFiles = async ({ key, value }) => {
    const gfs = getGFS();
    try {
        // Create dynamic query object for GridFS metadata
        const query = { [`metadata.${key}`]: value };
        const files = await gfs.find(query).toArray();
        
        return files.map(file => ({
            ...file,
            thumbnailUrl: file.metadata.hasThumbnail ? `/thumbnail/${file._id}` : null
        }));
    } catch (error) {
        console.error('Error fetching files:', error);
        throw new Error('Failed to load files.');
    }
};

// function to serve thumbnails
const getThumbnail = async (req, res) => {
    const gfs = getGFS();
    const fileId = req.params.id;

    try {
        const file = await gfs.find({ _id: new ObjectId(fileId) }).toArray();
        if (!file || file.length === 0) {
            return res.status(404).send('File not found');
        }

        const fileType = file[0].contentType;

        // Check if it's a supported file type for thumbnail generation
        // if (fileType.startsWith('image/') || fileType === 'application/pdf') {
        const chunks = [];
        const downloadStream = gfs.openDownloadStream(new ObjectId(fileId));

        downloadStream.on('data', chunk => chunks.push(chunk));
        downloadStream.on('end', async () => {
            try {
                const buffer = Buffer.concat(chunks);
                const thumbnail = await generateThumbnail(buffer, fileType);

                if (thumbnail) {
                    res.set('Content-Type', 'image/png');
                    res.send(thumbnail);
                } else {
                    sendDefaultIcon(res, fileType);
                }
            } catch (error) {
                console.error('Error processing thumbnail:', error);
                sendDefaultIcon(res, fileType);
            }
        });

        downloadStream.on('error', (error) => {
            console.error('Error streaming file:', error);
            sendDefaultIcon(res, fileType);
        });
        // } else {
        //     // For non-image/pdf files, send appropriate icon
        //     sendDefaultIcon(res, fileType);
        // }
    } catch (error) {
        console.error('Error serving thumbnail:', error);
        res.status(500).send('Failed to generate thumbnail');
    }
};

// Helper function to send default icon
const sendDefaultIcon = (res, fileType) => {
    const iconPath = path.join(__dirname, '..', 'public', 'images', getDefaultThumbnail(fileType));
    res.sendFile(iconPath);
};

// Helper function to get default thumbnail based on file type
const getDefaultThumbnail = (fileType) => {
    if (fileType.startsWith('image/')) return 'image-icon.png';
    if (fileType === 'application/pdf') return 'pdf-icon.png';
    return 'file-icon.png';
};



module.exports = {
    listTexts,
    listFiles,
    downloadFile,
    // previewFile,
    renderDownloadPage,
    deleteText,
    deleteFile,
    getThumbnail,
};

