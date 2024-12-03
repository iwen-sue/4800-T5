// controllers/profileController.js
const bcrypt = require("bcrypt");
const { getDB } = require("../config/database");


const getProfile = async (req, res) => {
  try {
    const db = getDB();
    const pc = await db.collection("passcodes").findOne({ email: req.user.email });
    const passcode = pc ? pc.passcode : null;

    res.render("profile.ejs", { user: req.user, passcode });
  } catch (error) {
    console.error("Error getting profile:", error);
  }
};

const updateInfo = async (req, res) => {
  try {
    const db = getDB();
    const { name, email } = req.body;
    const updateFields = { name, email };

    await db
      .collection("users")
      .updateOne({ _id: req.user._id }, { $set: updateFields });

    res.redirect("/profile");
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).send("Error updating profile");
  }
};

const updatePassword = async (req, res) => {
    try {
        const db = getDB();
        const { password, confirmPassword } = req.body;
        const pc = await db.collection("passcodes").findOne({ email: req.user.email });
        const passcode = pc ? pc.passcode : null;

        if (password !== confirmPassword) {
            return res.render("profile.ejs", {
                user: req.user,
                passcode,
                error: "Passwords do not match"
            });
        }

        if (password.length < 8) {
            return res.render("profile.ejs", {
                user: req.user,
                passcode,
                error: "Password must be at least 8 characters long"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await db.collection("users").updateOne(
            { _id: req.user._id },
            { $set: { password: hashedPassword } }
        );
        
        res.redirect("/profile");
    } catch (error) {
        console.error(error);
        res.render("profile.ejs", {
            user: req.user,
            error: "Error updating password"
        });
    }
};

const unlinkGoogle = async (req, res) => {
  try {
    const db = getDB();
    const user = await db.collection("users").findOne({ _id: req.user._id });

    if (!user.password) {
      return res.redirect("/profile?error=missing-password");
    }

    await db.collection("users").updateOne(
      { _id: req.user._id },
      {
        $unset: { googleId: "" },
        $set: {
          authType: "local",
          createdAt: new Date(),
        },
      }
    );

    res.redirect("/profile");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error unlinking Google account");
  }
};

const deleteAccount = async (req, res) => {
  try {
    const db = getDB();
    const result = await db
      .collection("users")
      .deleteOne({ _id: req.user._id });

    if (result.deletedCount === 1) {
      req.logout((err) => {
        if (err) {
          console.error("Error logging out after account deletion:", err);
          return res.status(500).send("Error logging out");
        }
        res.redirect("/");
      });
    } else {
      console.log("User not found or deletion failed");
      res.status(500).send("Account deletion failed");
    }
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).send("Error deleting account");
  }
};



const uploadProfilePicture = async (req, res) => {
  try {
      if (!req.file) {
          return res.status(400).send("No file uploaded");
      }

      const db = getDB();
      const profileImgBuffer = req.file.buffer; // Get the file buffer
      const profileImgBase64 = profileImgBuffer.toString("base64"); // Convert to Base64

      // Update the user's profile_img field in the database
      await db.collection("users").updateOne(
          { _id: req.user._id },
          { $set: { profile_img: profileImgBase64 } }
      );

      res.redirect("/profile");
  } catch (error) {
      console.error("Error uploading profile picture:", error);
      res.status(500).send("Error uploading profile picture");
  }
};


module.exports = {
  getProfile,
  updateInfo,
  updatePassword,
  unlinkGoogle,
  deleteAccount,
  uploadProfilePicture,
};
