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
directories.forEach((dir) => {
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir);
	}
});

const app = express();
const port = 4444;

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(fileUpload()); // Use express-fileupload
// Setting up middlewares
app.use(cors());
app.use(express.json());
app.use(passportConfig.initialize());

// Route handler for the root URL "/"
app.get('/', (req, res) => {
	res.send('Welcome to my Cograd Express application!');
});

// Routing routes
app.use('/auth', require('./routes/authRoutes'));
app.use('/api', require('./routes/apiRoutes'));
app.use('/upload', require('./routes/uploadRoutes'));
app.use('/host', require('./routes/downloadRoutes'));

app.listen(port, () => {
	console.log(`Server started on port ${port}`);
});