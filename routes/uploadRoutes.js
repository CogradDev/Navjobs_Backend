const express = require("express");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const { promisify } = require("util");
const pipeline = promisify(require("stream").pipeline);

const router = express.Router();

// Dynamic import of multer
import('multer').then(multer => {
    const upload = multer.default();

    // Resume upload route
    router.post("/resume", upload.single("file"), (req, res) => {
        const { file } = req;
        if (file.detectedFileExtension !== ".pdf") {
            return res.status(400).json({
                message: "Invalid format"
            });
        } else {
            const filename = `${uuidv4()}${file.detectedFileExtension}`;
            pipeline(
                file.stream,
                fs.createWriteStream(`${__dirname}/../public/resume/${filename}`)
            )
            .then(() => {
                res.send({
                    message: "File uploaded successfully",
                    url: `/host/resume/${filename}`,
                });
            })
            .catch(() => {
                res.status(400).json({
                    message: "Error while uploading"
                });
            });
        }
    });

    // Profile upload route
    router.post("/profile", upload.single("file"), (req, res) => {
        const { file } = req;
        if (!file || (file.detectedFileExtension !== ".jpg" && file.detectedFileExtension !== ".png")) {
            return res.status(400).json({
                message: "Invalid format"
            });
        } else {
            const filename = `${uuidv4()}${file.detectedFileExtension}`;
            pipeline(
                file.stream,
                fs.createWriteStream(`${__dirname}/../public/profile/${filename}`)
            )
            .then(() => {
                res.send({
                    message: "Profile image uploaded successfully",
                    url: `/host/profile/${filename}`,
                });
            })
            .catch(() => {
                res.status(400).json({
                    message: "Error while uploading"
                });
            });
        }
    });
}).catch(err => console.error("Failed to load multer", err));

module.exports = router;