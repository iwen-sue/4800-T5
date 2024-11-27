const { getDB, getGFS } = require('../config/database');
const { ObjectId } = require('mongodb'); // Import ObjectId

// Function to get the list of texts for the user
const listTexts = async (email) => {
    const db = getDB();

    try {
        // Find texts uploaded by the user
        const texts = await db.collection('texts').find({ email }).toArray();
        return texts;
    } catch (error) {
        console.error('Error fetching texts:', error);
        throw new Error('Failed to load texts.');
    }
};

// Function to get the list of files for the user
const listFiles = async (email) => {
    const gfs = getGFS();

    try {
        // Find files uploaded by the user in GridFS
        const files = await gfs.find({ "metadata.email": email }).toArray();
        return files;
    } catch (error) {
        console.error('Error fetching files:', error);
        throw new Error('Failed to load files.');
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
        console.log("Files in DB:", await gfs.find().toArray());

    } catch (error) {
        console.error('Error downloading file:', error);
        res.status(500).send('Download failed');
    }
};

const previewFile = async (req, res) => {
    const gfs = getGFS();
    const fileId = req.params.id;

    try {
        // Find the file by ID
        const file = await gfs.find({ _id: new ObjectId(fileId) }).toArray();
        if (!file || file.length === 0) {
            return res.status(404).send('File not found');
        }

        // Get file type
        const fileType = file[0].contentType;

        // Render text files directly
        if (fileType.startsWith("text/")) {
            let fileContent = '';
            gfs.openDownloadStream(new ObjectId(fileId))
                .on('data', (chunk) => {
                    fileContent += chunk.toString();
                })
                .on('end', () => {
                    res.render('preview', { content: fileContent, fileType });
                });

        // Display image files inline
        } else if (fileType.startsWith("image/")) {
            res.set('Content-Type', fileType);
            gfs.openDownloadStream(new ObjectId(fileId)).pipe(res);

        // For PDF files, display inline
        } else if (fileType === "application/pdf") {
            res.set('Content-Type', fileType);
            res.set('Content-Disposition', 'inline');
            gfs.openDownloadStream(new ObjectId(fileId)).pipe(res);

        // Unsupported types: download fallback
        } else {
            res.set('Content-Type', 'application/octet-stream');
            res.set('Content-Disposition', `attachment; filename="${file[0].filename}"`);
            gfs.openDownloadStream(new ObjectId(fileId)).pipe(res);
        }
    } catch (error) {
        console.error('Error previewing file:', error);
        res.status(500).send('Preview failed');
    }
};


const renderDownloadPage = async (req, res) => {
    try {
        if (!req.user || !req.user.email) {
            return res.status(403).send('User not authenticated');
        }
        const texts = await listTexts(req.user.email);
        const files = await listFiles(req.user.email);

        if (req.user._id) {
            res.render('download', { texts, files, user: req.user });
        } else {
            res.render('download', { texts, files });
        }

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


module.exports = {
    listTexts,
    listFiles,
    downloadFile,
    previewFile,
    renderDownloadPage,
    deleteText,
    deleteFile
};

