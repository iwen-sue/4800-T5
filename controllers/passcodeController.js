// controllers/passcodeController.js
const { getDB } = require("../config/database");
const jwt = require("jsonwebtoken");
const sns = require("../config/sns");
const generatePC = require("../util/generatePC");

const generatePasscodeSMS = async (req, res) => {
  const db = getDB();
  const phone = req.body.phone;

  const existingPhone = await db.collection("passcodes").findOne({ phone: phone });
  if (existingPhone) {
    return res.status(400).send({ error: "This phone number already has an active access code" });
  }

  const passcode = await generatePC();
  const message = `Your passcode for CLIPPIO is ${passcode}.`;
  const params = {
    Message: message,
    PhoneNumber: phone,
  };

  try {
    await db.collection("passcodes").insertOne({
      phone: phone,
      passcode: passcode,
      createdAt: new Date(),
    });
    await sns.publish(params).promise();

  } catch (err) {
    console.error(err);
    res.status(500).send({ error: err.message });
    return;
  }

  res.status(200).send({ passcode });
};

const generatePasscode = async (req, res) => {
  const user = req.user;
  const db = getDB();
  const passcode = await generatePC();

  try {
    await db.collection("passcodes").insertOne({
      email: user.email,
      passcode: passcode,
      createdAt: new Date(),
    });
    
    
  } catch (err) {
    res.status(500).send({ error: err.message });
    return;
  }
  res.status(200).send({ passcode });
};

const verifyPasscode = async (req, res) => {
    const { passcode } = req.body;
    
    const db = getDB();
    try {
        // Check if passcode exists
        const passcodeExists = await db.collection("passcodes").findOne({ passcode: passcode });
        if (!passcodeExists) {
            res.status(404).send({ error: "Passcode not found." });
            return;
        }
        const email = passcodeExists.email || null;
        const phone = passcodeExists.phone || null;

        // Sign jwt token
        const token = jwt.sign({ email, phone }, process.env.JWT_SECRET, { expiresIn: '1h' }); // expires in 1h
        res.cookie('token', token, {
            httpOnly: true,    // Prevents access by JavaScript
            secure: true,      // Use HTTPS in production
            sameSite: 'strict' // Protect against CSRF
        });
        res.status(200).json({ message: "Passcode verified. Redirecting...", redirectUrl: "/download" });
    } catch (error) {
        console.error("Error during verification:", error);
        res.status(500).json({ error: "Internal Server Error." });
    }
};


const checkPasscode = async (req, res) => {
  try {
      const db = getDB();
      const existingPasscode = await db.collection('passcodes').findOne({
          email: req.user.email, // Check by user email
      });

      if (existingPasscode) {
          return res.json({
              passcode: existingPasscode.passcode,
          });
      }

      // No passcode exists
      return res.json({ passcode: null });
  } catch (error) {
      console.error('Error checking passcode:', error);
      res.status(500).json({ error: 'Could not check passcode' });
  }
};


module.exports = {
  generatePasscode,
  generatePasscodeSMS,
  verifyPasscode,
  checkPasscode,
};
