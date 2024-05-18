const mongoose = require('mongoose');

const jobApplicantSchema = new mongoose.Schema({
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		required: true,
		ref: 'User'
	},
	name: {
		type: String,
		required: true
	},
	education: {
		type: [String],
		required: true
	},
	skills: {
		type: [String],
		required: true
	},
	rating: {
		type: Number,
		default: -1
	},
	resume: {
		type: String, // Storing file path
		required: true
	},
	profile: {
		type: String, // Storing file path
		required: true
	}
});

module.exports = mongoose.model('JobApplicant', jobApplicantSchema);
