// controllers/passcodeController.js
const { getDB } = require("../config/database");
const jwt = require("jsonwebtoken");

const getPasscode = async (req, res) => {
    try {
        const db = getDB();
        const isGenerated = await db.collection("passcodes").findOne({ email: req.user.email });
        if (!isGenerated) {
            res.status(404).send({ error: "You don't have passcode yet." });
            return;
        }
        res.status(200).send({ passcode: isGenerated.passcode });
    } catch (err) {
        res.status(500).send({ error: "Failed to get passcode" }); 
    }
};

const generatePasscode = async (req, res) => {
  const user = req.user;
  const db = getDB();

  // get 4 digit random number
  const passcode = Math.floor(1000 + Math.random() * 9000);

  // retry if passcode already exists
    const passcodeExists = await db.collection("passcodes").findOne({ passcode: passcode });
    if (passcodeExists) {
        generatePasscode(req, res);  // TODO need to change this to avoid infinite loop
        return;
    }
  // save passcode to database
  try {
    await db.collection("passcodes").insertOne({
      email: user.email,
      passcode: passcode,
      createdAt: new Date(),
    });
  } catch (err) {
    res.status(500).send({ error: "You cannot generate another code while your recent code exists." });
    return;
  }
  res.status(200).send({ passcode });
};

const verifyPasscode = async (req, res) => {
    const { passcode } = req.body;
    
    const db = getDB();
    try {
        // Check if passcode exists
        const passcodeExists = await db.collection("passcodes").findOne({ passcode: parseInt(passcode) });
        if (!passcodeExists) {
            res.status(404).send({ error: "Passcode not found." });
            return;
        }
        const email = passcodeExists.email;

        // Sign jwt token
        const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' }); // expires in 1h
        res.cookie('token', token, {
            httpOnly: true,    // Prevents access by JavaScript
            secure: true,      // Use HTTPS in production
            sameSite: 'strict' // Protect against CSRF
        });
        // res.status(200).json({ message: "Passcode verified." });
        res.status(200).json({ message: "Passcode verified. Redirecting...", redirectUrl: "/download" });
    } catch (error) {
        console.error("Error during verification:", error);
        res.status(500).json({ error: "Internal Server Error." });
    }
};


module.exports = {
  getPasscode,
  generatePasscode,
  verifyPasscode,
};
