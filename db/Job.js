const mongoose = require('mongoose');

let schema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			required: true
		},
		title: {
			type: String,
			required: true
		},
		companyName: {
			type: String
		},
		location: {
			type: String
		},
		jobType: {
			type: String,
			required: true
		},
		salary: {
			type: Number,
			validate: [
				{
					validator: Number.isInteger,
					msg: 'Salary should be an integer'
				},
				{
					validator: function (value) {
						return value >= 0;
					},
					msg: 'Salary should be positive'
				}
			]
		},
		jobDescription: {
			type: String,
			required: true
		},
		requiredSkillset: {
			type: [String],
			required: true
		},
		duration: {
			type: Number,
			min: 0,
			validate: [
				{
					validator: Number.isInteger,
					msg: 'Duration should be an integer'
				}
			]
		},
		postedBy: {
			type: String
		},
		applicationDeadline: {
			type: Date,
			validate: [
				{
					validator: function (value) {
						return this.dateOfPosting < value;
					},
					msg: 'Application deadline should be greater than the date of posting'
				}
			]
		},
		experienceLevel: {
			type: String,
			required: true
		},
		educationRequirement: {
			type: String,
			required: true
		},
		industry: {
			type: String
		},
		employmentType: {
			type: String,
			required: true
		},
		companyDescription: {
			type: String
		},
		contactInformation: {
			type: String
		},
		dateOfPosting: {
			type: Date,
			default: Date.now
		},
		maxApplicants: {
			type: Number,
			validate: [
				{
					validator: Number.isInteger,
					msg: 'maxApplicants should be an integer'
				},
				{
					validator: function (value) {
						return value > 0;
					},
					msg: 'maxApplicants should be greater than 0'
				}
			]
		},
		maxPositions: {
			type: Number,
			validate: [
				{
					validator: Number.isInteger,
					msg: 'maxPositions should be an integer'
				},
				{
					validator: function (value) {
						return value > 0;
					},
					msg: 'maxPositions should be greater than 0'
				}
			]
		},
		activeApplications: {
			type: Number,
			default: 0,
			validate: [
				{
					validator: Number.isInteger,
					msg: 'activeApplications should be an integer'
				},
				{
					validator: function (value) {
						return value >= 0;
					},
					msg: 'activeApplications should be greater than or equal to 0'
				}
			]
		},
		acceptedCandidates: {
			type: Number,
			default: 0,
			validate: [
				{
					validator: Number.isInteger,
					msg: 'acceptedCandidates should be an integer'
				},
				{
					validator: function (value) {
						return value >= 0;
					},
					msg: 'acceptedCandidates should be greater than or equal to 0'
				}
			]
		},
		rating: {
			type: Number,
			max: 5.0,
			default: -1.0,
			validate: {
				validator: function (v) {
					return v >= -1.0 && v <= 5.0;
				},
				msg: 'Invalid rating'
			}
		}
	},
	{ collation: { locale: 'en' } }
);

module.exports = mongoose.model('jobs', schema);
