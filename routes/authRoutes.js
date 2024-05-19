const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const authKeys = require('../lib/authKeys');
const User = require('../db/User');
const JobApplicant = require('../db/JobApplicant');
const OTPVerification = require('../db/OTP');
const Recruiter = require('../db/Recruiter');
const sendOTP = require('../lib/sendMails');
const bcrypt = require('bcryptjs');

const router = express.Router();

// Route to send OTP
router.post('/sendotp', async (req, res) => {
	const { email } = req.body;

	try {
		let user = await User.findOne({ email });

		if (user && user.isverified) {
			return res.status(400).json({
				success: false,
				message: 'This email is already verified. Please login directly.'
			});
		}

		await sendOTP(req, res);
	} catch (err) {
		console.error(err);
		return res.status(500).json({ success: false, message: 'Server error: Try again after sometime.' });
	}
});

// Route to verify OTP
router.post('/verifyotp', async (req, res) => {
	const { email, otp } = req.body;

	try {
		const userotp = await OTPVerification.findOne({ email });

		if (!userotp) {
			return res.status(400).json({ success: false, message: "OTP not found or expired." });
		}

		const otpCompare = await bcrypt.compare(otp, userotp.otp);

		if (!otpCompare) {
			return res.status(400).json({ success: false, message: 'OTP does not match.' });
		}

		await OTPVerification.findOneAndDelete({ email });

		return res.status(200).json({ success: true, message: 'OTP Verified Successfully!' });
	} catch (err) {
		console.error(err);
		return res.status(500).send('Internal server error occurred.');
	}
});

// Route to signup
router.post('/signup', async (req, res) => {
    const data = req.body;
    const resumeFile = req.files ? req.files.resume : null;
    const imageFile = req.files ? req.files.profile : null;

	console.log(resumeFile)
	console.log(imageFile)

    try {
        let user = await User.findOne({ email: data.email });

        if (user) {
            if (user.isverified) {
                return res.status(400).json({
                    success: false,
                    message: 'This email is already verified. Please login directly.'
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Please verify your email before signing up.'
                });
            }
        }

        user = new User({
            email: data.email,
            password: data.password, // Assuming password is hashed before saving
            type: data.type,
            isverified : true,
        });

        await user.save();

        let resumePath = null;
        let imagePath = null;

        if (resumeFile) {
            resumePath = `./public/resume/${Date.now()}-${resumeFile.name}`;
            await new Promise((resolve, reject) => {
                resumeFile.mv(resumePath, (err) => {
                    if (err) {
                        console.error(err);
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        }

        if (imageFile) {
            imagePath = `./public/profile/${Date.now()}-${imageFile.name}`;
			console.log(imagePath)
            await new Promise((resolve, reject) => {
                imageFile.mv(imagePath, (err) => {
                    if (err) {
                        console.error(err);
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        }

        if (data.type === 'recruiter') {
            let recruiter = new Recruiter({
                userId: user._id,
                name: data.name,
                contactNumber: data.contactNumber,
                bio: data.bio
            });
            await recruiter.save();
        } else {
            // Ensure education is an array of objects
            let education = [];
            if (Array.isArray(data.education)) {
                education = data.education.map(edu => ({
                    institutionName: edu.institutionName,
                    startYear: edu.startYear,
                    endYear: edu.endYear
                }));
            }

            let jobApplicant = new JobApplicant({
                userId: user._id,
                name: data.name,
                education: education,
                skills: data.skills,
                rating: data.rating,
                resume: resumePath,
                profile: imagePath
            });
            await jobApplicant.save();
        }

        return res.status(201).json({ success: true, message: 'User created successfully' });
    } catch (err) {
        console.error(err);
        return res.status(400).json({ success: false, message: 'Error signing up' });
    }
});


// Route to login
router.post('/login', (req, res, next) => {
	passport.authenticate('local', { session: false }, function (err, user, info) {
		if (err) {
			return next(err);
		}
		if (!user) {
			return res.status(401).json(info);
		}
		const token = jwt.sign({ _id: user._id }, authKeys.jwtSecretKey);
		return res.json({
			token: token,
			type: user.type,
			success: true,
			message: 'User logged in successfully'
		});
	})(req, res, next);
});

// Route to resend OTP
router.post('/resendotp', async (req, res) => {
	try {
		const { email } = req.body;
		let userotp = await OTPVerification.findOne({ email: email });
		if (!userotp) {
			return res.status(400).json({ success: false, message: "User doesn't exist." });
		}
		await sendOTP(req, res);
		return res.status(200).json({ success: true, message: 'OTP resent successfully' });
	} catch (err) {
		console.error(err);
		return res.status(500).json({
			success: false,
			message: 'Server error: Try again after sometime.'
		});
	}
});

module.exports = router;
