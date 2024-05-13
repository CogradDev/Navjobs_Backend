const nodemailer = require("nodemailer") // npm install nodemailer
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const OTPVerification = require("../db/OTP.js");

dotenv.config();

const sendOTP = async (req, res) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.OFFICIAL_MAIL,
            pass: process.env.MAIL_PASS
        }
    })

    const otp = `${Math.floor(1000 + Math.random() * 9000)}`;

    const mailOptions = {
        from: process.env.OFFICIAL_MAIL,
        to: req.body.email,
        subject: 'Verify Your Email(Testing Period)',
        html: `<p>OTP for verification at cograd.in is : <b>${otp}</b>.<br>This code is expires within 2 minutes.</p>`
    }

    try {
        // Securing OTP
        const salt = await bcrypt.genSalt(10);
        const secOTP = await bcrypt.hash(otp, salt);

        let user = await OTPVerification.findOne({ email: req.body.email });
        if (user) {
            const currDate = new Date();

            const newOTP = {
                email: req.body.email,
                otp: secOTP,
                timestamp: new Date(currDate.getTime())
            }
            
            try {
                await OTPVerification.findOneAndUpdate({ email: req.body.email }, { $set: newOTP }, { new: true });
                await transporter.sendMail(mailOptions);

                return res.status(201).json({
                    success: true,
                    message: "OTP has been again send successfully."
                });

            } catch (err) {
                return res.status(500).json({success: false, message: "Unable to send otp, try again letter."});
            }

        }

        await OTPVerification.create({
            email: req.body.email,
            otp: secOTP,
        }).then(async () => {
            await transporter.sendMail(mailOptions).then(() => {
                return res.status(201).json({
                    success: true,
                    message: "OTP has been send successfully"
                });
            }).catch(() => {
                return res.status(500).json({
                    success: false,
                    message: "Server error: Unable to send otp"
                });
            })
        }).catch(() => {
            return res.status(500).json({
                success: false,
                message: "Server error occured, Please try again!"
            });
        })

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Server error occured, Please try again!"
        });
    }

}

module.exports = sendOTP;