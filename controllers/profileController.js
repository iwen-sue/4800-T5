// controllers/profileController.js
const bcrypt = require('bcrypt');
const { getDB } = require('../config/database');

const getProfile = (req, res) => {
    res.render('profile.ejs', { user: req.user });
};

const updateInfo = async (req, res) => {
    try {
        const db = getDB();
        const { name, email } = req.body;
        const updateFields = { name, email };

        await db.collection('users').updateOne(
            { _id: req.user._id },
            { $set: updateFields }
        );
        
        res.redirect('/profile');
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).send('Error updating profile');
    }
};

const updatePassword = async (req, res) => {
    try {
        const db = getDB();
        const { password, confirmPassword } = req.body;

        if (password !== confirmPassword) {
            return res.status(400).send('Passwords do not match');
        }

        if (password.length < 8) {
            return res.status(400).send('Password must be at least 8 characters long');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await db.collection('users').updateOne(
            { _id: req.user._id },
            { $set: { password: hashedPassword } }
        );

        res.redirect('/profile');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error updating password');
    }
};

const unlinkGoogle = async (req, res) => {
    try {
        const db = getDB();
        const user = await db.collection('users').findOne({ _id: req.user._id });

        if (!user.password) {
            return res.redirect('/profile?error=missing-password');
        }

        await db.collection('users').updateOne(
            { _id: req.user._id },
            {
                $unset: { googleId: "" },
                $set: {
                    authType: "local",
                    createdAt: new Date()
                }
            }
        );

        res.redirect('/profile');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error unlinking Google account');
    }
};

const deleteAccount = async (req, res) => {
    try {
        const db = getDB();
        const result = await db.collection('users').deleteOne({ _id: req.user._id });

        if (result.deletedCount === 1) {
            req.logout((err) => {
                if (err) {
                    console.error('Error logging out after account deletion:', err);
                    return res.status(500).send('Error logging out');
                }
                res.redirect('/');
            });
        } else {
            console.log('User not found or deletion failed');
            res.status(500).send('Account deletion failed');
        }
    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).send('Error deleting account');
    }
};

module.exports = {
    getProfile,
    updateInfo,
    updatePassword,
    unlinkGoogle,
    deleteAccount
};