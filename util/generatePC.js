// util/generatePasscode.js

const { getDB } = require("../config/database");

const generatePC = async () => {
    const db = getDB();

    // get random 6-digit passcode alphanumeric
    const passcode = Math.random().toString(36).slice(2, 8).toUpperCase();
    console.log("Generated passcode:", passcode);

    const passcodeExists = await db
        .collection("passcodes")
        .findOne({ passcode: passcode });

    if (passcodeExists) {
        generatePC();
        return;
    }

    return passcode;
};

module.exports = generatePC;
