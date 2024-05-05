const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const authKeys = require("../lib/authKeys");

const User = require("../db/User");
const JobApplicant = require("../db/JobApplicant");
const OTPVerification = require("../db/OTP");
const Recruiter = require("../db/Recruiter");
const sendOTP = require("../lib/sendMails");
const bcrypt = require("bcryptjs");

const router = express.Router();

router.post("/signup", async (req, res) => {
  const data = req.body;

  let isUser = await User.findOne({ email: data.email });

  if (isUser && isUser.isverified) {
    return res.status(400).json({ success: false, message: "Sorry a user with this email already exists" });
  }

  if (isUser && !isUser.isverified) {
    return sendOTP(req, res);
  }

  let user = new User({
    email: data.email,
    password: data.password,
    type: data.type,
  });

  user
    .save()
    .then(() => {
      const userDetails =
        user.type == "recruiter"
          ? new Recruiter({
            userId: user._id,
            name: data.name,
            contactNumber: data.contactNumber,
            bio: data.bio,
          })
          : new JobApplicant({
            userId: user._id,
            name: data.name,
            education: data.education,
            skills: data.skills,
            rating: data.rating,
            resume: data.resume,
            profile: data.profile,
          });

      userDetails
        .save()
        .then(() => {
          return sendOTP(req, res);
        })
        .catch((err) => {
          user
            .delete()
            .then(() => {
              res.status(400).json(err);
            })
            .catch((err) => {
              res.json({ error: err });
            });
          err;
        });
    })
    .catch((err) => {
      res.status(400).json(err);
    });
});

router.post("/login", (req, res, next) => {
  passport.authenticate(
    "local",
    { session: false },
    function (err, user, info) {
      if (err) {
        return next(err);
      }
      if (!user) {
        res.status(401).json(info);
        return;
      }
      // Token
      const token = jwt.sign({ _id: user._id }, authKeys.jwtSecretKey);
      res.json({
        token: token,
        type: user.type,
        success: true,
        message: "User loged in successfully"
      });
    }
  )(req, res, next);
});

// Route 3 : Verify OTP and User : POST "/user/userauth/verifyotp"
router.post('/verifyotp', async (req, res) => {
  let success = false;
  const { email, otp } = req.body;

  try {
    // check whether the user with the email exists already.
    let userotp = await OTPVerification.findOne({ email: email });
    if (!userotp) {
      return res.status(400).json({ success, message: "User doesn't exist." })
    }

    const currDate = new Date();

    if (currDate.getTime() <= (userotp.timestamp + 120000)) {
      const otpCompare = await bcrypt.compare(otp, userotp.otp);
      if (!otpCompare) {
        return res.status(400).json({ success, message: "OTP does not matched." });
      }

      const newUser = {};
      newUser.isverified = true;

      let user = await User.findOneAndUpdate({ email }, { $set: newUser }, { new: true });
      await OTPVerification.findOneAndDelete({ email });

      // Token
      const token = jwt.sign({ _id: user._id }, authKeys.jwtSecretKey);

      success = true;
      return res.status(200).json({ success, token, type: user.type, message: "OTP Verified Successfully!" });
    }
    else {
      return res.status(400).json({ success: false, message: "Time limit exceed. Please try again." });
    }

  }
  catch (err) {
    console.log(err.message);
    res.status(500).send("Internal server error occured.");
  }

});

router.post('/resendotp', async (req, res) => {
  try {
    let userotp = await OTPVerification.findOne({ email: email });
    if (!userotp) {
      return res.status(400).json({ success: false, message: "User doesn't exist." })
    }
    sendOTP(req, res);
  }
  catch (err) {
    res.status(500).json({ success: false, message: "Server error: Try after sometime." })
  }
})

module.exports = router;
