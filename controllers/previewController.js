// previewController.js
const { getDB, getGFS } = require('../config/database');
const { ObjectId } = require('mongodb');

// Render the preview page
const renderPreviewPage = async (req, res) => {
    const gfs = getGFS();
    const fileId = req.params.id;

    try {
        // Find the file by ID
        const file = await gfs.find({ _id: new ObjectId(fileId) }).toArray();
        if (!file || file.length === 0) {
            return res.status(404).send('File not found');
        }

        // Determine file type
        const fileType = file[0].contentType;
        console.log('File type-previewController:', fileType);

        const renderOptions = { fileType, fileId };

        if (req.user && req.user._id) {
            renderOptions.user = req.user;
        }

        if (fileType.startsWith('text/')) {
            // Render text content
            let fileContent = '';
            gfs.openDownloadStream(new ObjectId(fileId))
                .on('data', (chunk) => {
                    fileContent += chunk.toString();
                })
                .on('end', () => {
                    renderOptions.content = fileContent;
                    res.render('preview', renderOptions);
                });
        } else if (fileType.startsWith('image/') || fileType === 'application/pdf') {
            // Render image or PDF inline
            renderOptions.content = null; // Images and PDFs are served inline
            res.render('preview', renderOptions);
        } else {
            // For unsupported types, fallback with a message
            renderOptions.content = 'Unsupported file type for preview.';
            res.render('preview', renderOptions);
        }
    } catch (error) {
        console.error('Error rendering preview page:', error);
        res.status(500).send('Failed to load preview');
    }
};


// Serve content for image or PDF inline preview
const servePreviewContent = async (req, res) => {
    const gfs = getGFS();
    const fileId = req.params.id;

    try {
        // Stream file content directly for inline display
        const file = await gfs.find({ _id: new ObjectId(fileId) }).toArray();
        if (!file || file.length === 0) {
            return res.status(404).send('File not found');
        }

        const fileType = file[0].contentType;
        res.set('Content-Type', fileType);
        gfs.openDownloadStream(new ObjectId(fileId)).pipe(res);
    } catch (error) {
        console.error('Error serving preview content:', error);
        res.status(500).send('Failed to serve preview content');
    }
};

module.exports = {
    renderPreviewPage,
    servePreviewContent,
};
