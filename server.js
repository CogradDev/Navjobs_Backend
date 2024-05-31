const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const passportConfig = require('./lib/passportConfig');
const cors = require('cors');
const fs = require('fs');
const fileUpload = require('express-fileupload');
require('dotenv').config();

// MongoDB
mongoose
    .connect(process.env.MONGODB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: false
    })
    .then(() => console.log('Connected to DB'))
    .catch((err) => console.log(err));

// Initialising directories
const directories = ['./public', './public/resume', './public/profile'];
directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
});

const app = express();
const port = process.env.PORT || 4444; // Use environment port if available

app.use(fileUpload()); // File upload middleware
app.use(bodyParser.json()); // JSON parsing middleware
app.use(bodyParser.urlencoded({ extended: true })); // URL encoded bodies middleware
app.use(cors()); // CORS middleware
app.use(express.json()); // JSON parsing middleware
app.use(passportConfig.initialize()); // Passport initialization

// Static file serving
app.use('/public', express.static(__dirname + '/public'));

// Route handler for the root URL "/"
app.get('/', (req, res) => {
    res.send('Welcome to my Cograd Express application!');
});

// Routing routes
app.use('/auth', require('./routes/authRoutes'));
app.use('/api', require('./routes/apiRoutes'));
app.use('/upload', require('./routes/uploadRoutes'));
app.use('/host', require('./routes/downloadRoutes'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Graceful shutdown
process.on('SIGINT', () => {
    mongoose.connection.close(() => {
        console.log('MongoDB disconnected');
        process.exit(0);
    });
});

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});