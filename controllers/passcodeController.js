// controllers/passcodeController.js
const { getDB } = require("../config/database");

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

module.exports = {
  getPasscode,
  generatePasscode,
};
