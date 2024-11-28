// controllers/passcodeController.js
const { getDB } = require("../config/database");
const jwt = require("jsonwebtoken");

const generatePasscode = async (req, res) => {
  const user = req.user;
  const db = getDB();

  // get random 6-digit passcode alphanumeric
  const passcode = Math.random().toString(36).slice(2, 8).toUpperCase();
  console.log("Generated passcode:", passcode);

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
        const passcodeExists = await db.collection("passcodes").findOne({ passcode: passcode });
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
        res.status(200).json({ message: "Passcode verified. Redirecting...", redirectUrl: "/download" });
    } catch (error) {
        console.error("Error during verification:", error);
        res.status(500).json({ error: "Internal Server Error." });
    }
};


module.exports = {
  generatePasscode,
  verifyPasscode,
};
