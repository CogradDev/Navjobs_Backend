const express = require('express');
const mongoose = require('mongoose');
const jwtAuth = require('../lib/jwtAuth');

const User = require('../db/User');
const JobApplicant = require('../db/JobApplicant');
const Recruiter = require('../db/Recruiter');
const Job = require('../db/Job');
const Application = require('../db/Application');
const Rating = require('../db/Rating');

const router = express.Router();

// To add new job
router.post('/jobs', jwtAuth, async (req, res) => {
	const user = req.user;

	if (user.type !== 'recruiter') {
		res.status(401).json({
			success: false,
			message: "You don't have permissions to add jobs"
		});
		return;
	}

	const recruiter = await Recruiter.findOne({ userId: user._id });
	//console.log(recruiter)

	const data = req.body;

	let job = new Job({
		userId: user._id,
		title: data.title,
		companyName: data.companyName,
		location: recruiter.location,
		jobType: data.jobType,
		salary: data.salary,
		jobDescription: data.jobDescription,
		requiredSkillset: data.requiredSkillset,
		duration: data.duration,
		companyName: recruiter.companyName,
		applicationDeadline: data.applicationDeadline,
		experienceLevel: data.experienceLevel,
		educationRequirement: data.educationRequirement,
		industry: data.industry,
		employmentType: data.employmentType,
		companyDescription: data.companyDescription,
		contactInformation: data.contactInformation,
		dateOfPosting: data.dateOfPosting || new Date(),
		maxApplicants: data.maxApplicants,
		maxPositions: data.maxPositions,
		activeApplications: data.activeApplications || 0,
		acceptedCandidates: data.acceptedCandidates || 0,
		rating: data.rating || -1.0
	});

	job
		.save()
		.then(() => {
			res.json({ success: true, message: 'Job added successfully to the database' });
		})
		.catch((err) => {
			res.status(400).json({ success: false, message: err.message });
		});
});

// To get all the jobs [with filtering and sorting] without authentication
router.get('/jobs', async (req, res) => {
	let findParams = {};
	let sortParams = {};

	// Search filter based on job details
	if (req.query.q) {
		const searchRegex = new RegExp(req.query.q, 'i');
		findParams.$or = [
			{ title: searchRegex },
			{ companyName: searchRegex },
			{ location: searchRegex },
			{ jobType: searchRegex },
			{ jobDescription: searchRegex },
			{ requiredSkillset: { $in: [searchRegex] } }, // Match any skill in requiredSkillset
			{ experienceLevel: searchRegex },
			{ educationRequirement: searchRegex },
			{ industry: searchRegex },
			{ employmentType: searchRegex },
			{ companyDescription: searchRegex }
		];
	}

	if (req.query.locationQuery) {
		const location = req.query.locationQuery.trim().toLowerCase();
		if (location === 'remote' || location === 'work from home') {
			findParams.$or = [
				{ location: { $regex: /remote|work from home/i } }, // Case-insensitive match for remote or work from home
				{ jobType: { $regex: /remote|work from home/i } } // Case-insensitive match for job type remote or work from home
			];
		} else {
			findParams.location = { $regex: new RegExp(location, 'i') }; // Case-insensitive match for the location
		}
	}

	if (req.query.jobType) {
		let jobTypes = Array.isArray(req.query.jobType) ? req.query.jobType : [req.query.jobType];
		findParams.jobType = { $in: jobTypes };
	}

	if (req.query.salaryMin && req.query.salaryMax) {
		findParams.salary = {
			$gte: parseInt(req.query.salaryMin),
			$lte: parseInt(req.query.salaryMax)
		};
	} else if (req.query.salaryMin) {
		findParams.salary = { $gte: parseInt(req.query.salaryMin) };
	} else if (req.query.salaryMax) {
		findParams.salary = { $lte: parseInt(req.query.salaryMax) };
	}

	if (req.query.duration) {
		findParams.duration = { $gte: parseInt(req.query.duration) };
	}

	if (req.query.asc) {
		let keys = Array.isArray(req.query.asc) ? req.query.asc : [req.query.asc];
		keys.forEach((key) => (sortParams[key] = 1));
	}

	if (req.query.desc) {
		let keys = Array.isArray(req.query.desc) ? req.query.desc : [req.query.desc];
		keys.forEach((key) => (sortParams[key] = -1));
	}

	if (req.query.sort) {
		const sortOrder = req.query.order === 'asc' ? 1 : -1;
		switch (req.query.sort) {
			case 'date':
				sortParams.createdAt = sortOrder; // Ascending or descending based on order
				break;
			case 'salary':
				sortParams.salary = sortOrder; // Ascending or descending based on order
				break;
			case 'duration':
				sortParams.duration = sortOrder; // Ascending or descending based on order
				break;
			case 'rating':
				sortParams.rating = sortOrder; // Ascending or descending based on order
				break;
			default:
				break;
		}
	}

	try {
		const jobs = await Job.find(findParams).sort(sortParams);
		if (!jobs || jobs.length === 0) {
			return res.status(404).json({ success: false, message: 'No jobs found' });
		}
		res.json({ success: true, data: jobs });
	} catch (err) {
		res.status(400).json({ success: false, message: err.message });
	}
});

// To get jobs created by a particular recruiter
router.get('/jobs/recruiter', jwtAuth, async (req, res) => {
	let user = req.user;
	console.log('hi');
	if (user.type !== 'recruiter') {
		return res.status(403).json({ success: false, message: 'Access denied' });
	}

	let findParams = { userId: user._id };
	let sortParams = {};

	if (req.query.q) {
		const searchRegex = new RegExp(req.query.q, 'i');
		findParams.$or = [
			{ title: searchRegex },
			{ companyName: searchRegex },
			{ location: searchRegex },
			{ jobType: searchRegex },
			{ jobDescription: searchRegex },
			{ requiredSkillset: { $in: [searchRegex] } },
			{ experienceLevel: searchRegex },
			{ educationRequirement: searchRegex },
			{ industry: searchRegex },
			{ employmentType: searchRegex },
			{ companyDescription: searchRegex }
		];
	}

	if (req.query.locationQuery) {
		const location = req.query.locationQuery.trim().toLowerCase();
		if (location === 'remote' || location === 'work from home') {
			findParams.$or = [
				{ location: { $regex: /remote|work from home/i } },
				{ jobType: { $regex: /remote|work from home/i } }
			];
		} else {
			findParams.location = { $regex: new RegExp(location, 'i') };
		}
	}

	if (req.query.jobType) {
		let jobTypes = Array.isArray(req.query.jobType) ? req.query.jobType : [req.query.jobType];
		findParams.jobType = { $in: jobTypes };
	}

	if (req.query.salaryMin && req.query.salaryMax) {
		findParams.salary = {
			$gte: parseInt(req.query.salaryMin),
			$lte: parseInt(req.query.salaryMax)
		};
	} else if (req.query.salaryMin) {
		findParams.salary = { $gte: parseInt(req.query.salaryMin) };
	} else if (req.query.salaryMax) {
		findParams.salary = { $lte: parseInt(req.query.salaryMax) };
	}

	if (req.query.duration) {
		findParams.duration = { $gte: parseInt(req.query.duration) };
	}

	if (req.query.asc) {
		let keys = Array.isArray(req.query.asc) ? req.query.asc : [req.query.asc];
		keys.forEach((key) => (sortParams[key] = 1));
	}

	if (req.query.desc) {
		let keys = Array.isArray(req.query.desc) ? req.query.desc : [req.query.desc];
		keys.forEach((key) => (sortParams[key] = -1));
	}

	if (req.query.sort) {
		const sortOrder = req.query.order === 'asc' ? 1 : -1;
		switch (req.query.sort) {
			case 'date':
				sortParams.createdAt = sortOrder;
				break;
			case 'salary':
				sortParams.salary = sortOrder;
				break;
			case 'duration':
				sortParams.duration = sortOrder;
				break;
			case 'rating':
				sortParams.rating = sortOrder;
				break;
			default:
				break;
		}
	}

	try {
		const jobs = await Job.find(findParams).sort(sortParams);
		if (!jobs || jobs.length === 0) {
			return res.status(404).json({ success: false, message: 'No jobs found' });
		}
		res.json({ success: true, data: jobs });
	} catch (err) {
		res.status(400).json({ success: false, message: err.message });
	}
});

// to get info about a particular job
router.get('/jobs/:id', jwtAuth, (req, res) => {
	Job.findOne({ _id: req.params.id })
		.then((job) => {
			if (job == null) {
				res.status(400).json({
					success: false,
					message: 'Job does not exist'
				});
				return;
			}
			res.json({ success: true, data: job });
		})
		.catch((err) => {
			res.status(400).json({ success: false, message: err });
		});
});

// to update info of a particular job
router.put('/jobs/:id', jwtAuth, async (req, res) => {
	try {
		const user = req.user;
		if (user.type !== 'recruiter') {
			return res.status(401).json({
				success: false,
				message: "You don't have permissions to change the job details"
			});
		}

		const job = await Job.findOne({
			_id: req.params.id,
			userId: user.id
		});

		if (!job) {
			return res.status(404).json({
				success: false,
				message: 'Job does not exist'
			});
		}

		const {
			maxApplicants,
			maxPositions,
			deadline,
			title,
			jobType,
			salary,
			duration,
			experienceLevel,
			educationRequirement,
			employmentType,
			jobDescription,
			requiredSkillset
		} = req.body;
		if (maxApplicants) {
			job.maxApplicants = maxApplicants;
		}
		if (maxPositions) {
			job.maxPositions = maxPositions;
		}
		if (deadline) {
			job.deadline = deadline;
		}
		if (title) {
			job.title = title;
		}
		if (jobType) {
			job.jobType = jobType;
		}
		if (salary) {
			job.salary = salary;
		}
		if (duration) {
			job.duration = duration;
		}
		if (experienceLevel) {
			job.experienceLevel = experienceLevel;
		}
		if (employmentType) {
			job.employmentType = employmentType;
		}
		if (jobDescription) {
			job.jobDescription = jobDescription;
		}
		if (educationRequirement) {
			job.educationRequirement = educationRequirement;
		}
		if (requiredSkillset) {
			job.requiredSkillset = requiredSkillset;
		}

		await job.save();

		return res.json({
			success: true,
			message: 'Job details updated successfully'
		});
	} catch (err) {
		return res.status(400).json({ success: false, message: err.message });
	}
});

// to delete a job
router.delete('/jobs/:id', jwtAuth, (req, res) => {
	const user = req.user;

	if (user.type != 'recruiter') {
		res.status(401).json({
			success: false,
			message: "You don't have permissions to delete the job"
		});
		return;
	}
	Job.findOneAndDelete({
		_id: req.params.id,
		userId: user.id
	})
		.then((job) => {
			if (job === null) {
				res.status(401).json({
					success: false,
					message: "You don't have permissions to delete the job"
				});
				return;
			}
			res.json({
				success: true,
				message: 'Job deleted successfully'
			});
		})
		.catch((err) => {
			res.status(400).json({ success: false, message: err });
		});
});

// get user's personal details
router.get('/user', jwtAuth, (req, res) => {
	const user = req.user;
	if (user.type === 'recruiter') {
		Recruiter.findOne({ userId: user._id })
			.then((recruiter) => {
				if (recruiter == null) {
					res.status(404).json({
						success: false,
						message: 'User does not exist'
					});
					return;
				}
				res.json({ success: true, data: recruiter });
			})
			.catch((err) => {
				res.status(400).json(err);
			});
	} else {
		JobApplicant.findOne({ userId: user._id })
			.then((jobApplicant) => {
				if (jobApplicant == null) {
					res.status(404).json({
						success: false,
						message: 'User does not exist'
					});
					return;
				}
				res.json({ success: true, jobApplicant });
			})
			.catch((err) => {
				res.status(400).json(err);
			});
	}
});

// get user details from id
router.get('/user/:id', jwtAuth, (req, res) => {
	User.findOne({ _id: req.params.id })
		.then((userData) => {
			if (userData === null) {
				res.status(404).json({
					success: false,
					message: 'User does not exist'
				});
				return;
			}

			if (userData.type === 'recruiter') {
				Recruiter.findOne({ userId: userData._id })
					.then((recruiter) => {
						if (recruiter === null) {
							res.status(404).json({
								message: 'User does not exist'
							});
							return;
						}
						res.json(recruiter);
					})
					.catch((err) => {
						res.status(400).json(err);
					});
			} else {
				JobApplicant.findOne({ userId: userData._id })
					.then((jobApplicant) => {
						if (jobApplicant === null) {
							res.status(404).json({
								message: 'User does not exist'
							});
							return;
						}
						res.json(jobApplicant);
					})
					.catch((err) => {
						res.status(400).json(err);
					});
			}
		})
		.catch((err) => {
			res.status(400).json(err);
		});
});

// update user details
router.put('/user', jwtAuth, async (req, res) => {
	const user = req.user;
	const data = req.body;

	const resumeFile = req.files ? req.files.resume : null;
	const imageFile = req.files ? req.files.profile : null;

	let resumePath = null;
	let imagePath = null;

	if (resumeFile) {
		resumePath = `./public/resume/${Date.now()}-${resumeFile.name}`;
		await resumeFile.mv(resumePath);
	}

	if (imageFile) {
		imagePath = `./public/profile/${Date.now()}-${imageFile.name}`;
		await imageFile.mv(imagePath);
	}

	try {
		if (user.type == 'recruiter') {
			const recruiter = await Recruiter.findOne({ userId: user._id });
			if (!recruiter) {
				return res.status(404).json({ success: false, message: 'User does not exist' });
			}

			if (data.name) recruiter.name = data.name;
			if (data.contactNumber) recruiter.contactNumber = data.contactNumber;
			if (data.bio) recruiter.bio = data.bio;
			if (data.companyName) recruiter.companyName = data.companyName;
			if (data.location) recruiter.location = data.location;
			if (data.industry) recruiter.industry = data.industry;
			if (data.companyDescription) recruiter.companyDescription = data.companyDescription;

			await recruiter.save();
			return res.json({ success: true, message: 'User information updated successfully' });
		} else {
			const jobApplicant = await JobApplicant.findOne({ userId: user._id });
			if (!jobApplicant) {
				return res.status(404).json({ success: false, message: 'User does not exist' });
			}

			if (data.name) jobApplicant.name = data.name;
			if (data.education) jobApplicant.education = JSON.parse(data.education);
			if (data.skills) jobApplicant.skills = JSON.parse(data.skills);
			if (resumePath) jobApplicant.resume = resumePath;
			if (imagePath) jobApplicant.profile = imagePath;
			if (data.contactNumber) jobApplicant.contactNumber = data.contactNumber;
			if (data.bio) jobApplicant.bio = data.bio;

			await jobApplicant.save();
			return res.json({ success: true, message: 'User information updated successfully' });
		}
	} catch (err) {
		return res
			.status(400)
			.json({ success: false, message: 'Failed to update user information', error: err });
	}
});

// apply for a job [todo: test: done]
router.post('/jobs/:id/applications', jwtAuth, async (req, res) => {
	const user = req.user;

	if (user.type !== 'applicant') {
		return res.status(401).json({ message: "You don't have permissions to apply for a job" });
	}

	const data = req.body;
	const jobId = req.params.id;

	try {
		// Check if the user has already applied for this job
		const appliedApplication = await Application.findOne({
			userId: user._id,
			jobId: jobId,
			status: { $nin: ['deleted', 'accepted', 'cancelled'] }
		});

		if (appliedApplication) {
			return res.status(400).json({ message: 'You have already applied for this job' });
		}

		// Find the job
		const job = await Job.findOne({ _id: jobId });
		if (!job) {
			return res.status(404).json({ message: 'Job does not exist' });
		}

		// Check the count of active applications for the job
		const activeApplicationCount = await Application.countDocuments({
			jobId: jobId,
			status: { $nin: ['rejected', 'deleted', 'cancelled', 'finished'] }
		});

		if (activeApplicationCount >= job.maxApplicants) {
			return res.status(400).json({ message: 'Application limit reached' });
		}

		// Check the count of active applications by the user
		const myActiveApplicationCount = await Application.countDocuments({
			userId: user._id,
			status: { $nin: ['rejected', 'deleted', 'cancelled', 'finished'] }
		});

		if (myActiveApplicationCount >= 10) {
			return res
				.status(400)
				.json({ message: 'You have 10 active applications. Hence you cannot apply.' });
		}

		// Check if the user has any accepted jobs
		const acceptedJobs = await Application.countDocuments({
			userId: user._id,
			status: 'accepted'
		});

		if (acceptedJobs > 0) {
			return res
				.status(400)
				.json({ message: 'You already have an accepted job. Hence you cannot apply.' });
		}

		const applicant = await JobApplicant.findOne({ userId: user._id });

		// Store the application data
		const application = new Application({
			userId: user._id,
			email: user.email,
			recruiterId: job.userId,
			jobId: job._id,
			status: 'Applied',
			sop: data.sop,
			resume: applicant.resume,
			name: applicant.name,
			bio: applicant.bio,
			contactNumber: applicant.contactNumber,
			education: applicant.education,
			skills: applicant.skills,
			rating: applicant.rating,
			profile: applicant.profile,
			dateOfJoining: ''
		});

		await application.save();
		res.json({ message: 'Job application successful' });
	} catch (err) {
		res
			.status(500)
			.json({ message: 'An error occurred while processing your application', error: err.message });
	}
});

// recruiter gets applications for a particular job [pagination] [todo: test: done]
router.get('/jobs/:id/applications', jwtAuth, (req, res) => {
	const user = req.user;
	if (user.type != 'recruiter') {
		res.status(401).json({
			message: "You don't have permissions to view job applications"
		});
		return;
	}
	const jobId = req.params.id;

	// const page = parseInt(req.query.page) ? parseInt(req.query.page) : 1;
	// const limit = parseInt(req.query.limit) ? parseInt(req.query.limit) : 10;
	// const skip = page - 1 >= 0 ? (page - 1) * limit : 0;

	let findParams = {
		jobId: jobId,
		recruiterId: user._id
	};

	let sortParams = {};

	if (req.query.status) {
		findParams = {
			...findParams,
			status: req.query.status
		};
	}

	Application.find(findParams)
		.collation({ locale: 'en' })
		.sort(sortParams)
		// .skip(skip)
		// .limit(limit)
		.then((applications) => {
			res.json({ success: true, applications });
		})
		.catch((err) => {
			res.status(400).json(err);
		});
});

// recruiter/applicant gets all his applications [pagination]
router.get('/applications', jwtAuth, (req, res) => {
	const user = req.user;

	// const page = parseInt(req.query.page) ? parseInt(req.query.page) : 1;
	// const limit = parseInt(req.query.limit) ? parseInt(req.query.limit) : 10;
	// const skip = page - 1 >= 0 ? (page - 1) * limit : 0;

	Application.aggregate([
		{
			$lookup: {
				from: 'jobapplicantinfos',
				localField: 'userId',
				foreignField: 'userId',
				as: 'jobApplicant'
			}
		},
		{ $unwind: '$jobApplicant' },
		{
			$lookup: {
				from: 'jobs',
				localField: 'jobId',
				foreignField: '_id',
				as: 'job'
			}
		},
		{ $unwind: '$job' },
		{
			$lookup: {
				from: 'recruiterinfos',
				localField: 'recruiterId',
				foreignField: 'userId',
				as: 'recruiter'
			}
		},
		{ $unwind: '$recruiter' },
		{
			$match: {
				[user.type === 'recruiter' ? 'recruiterId' : 'userId']: user._id
			}
		},
		{
			$sort: {
				dateOfApplication: -1
			}
		}
	])
		.then((applications) => {
			res.json(applications);
		})
		.catch((err) => {
			res.status(400).json(err);
		});
});

// update status of application: [Applicant: Can cancel, Recruiter: Can do everything] [todo: test: done]
router.put('/applications/:id', jwtAuth, (req, res) => {
	const user = req.user;
	const id = req.params.id;
	const status = req.body.status;
	const dateOfJoining = Date.now();
	// Function to handle recruiter actions
	const handleRecruiterActions = () => {
		if (status === 'Accepted') {
			Application.findOne({ _id: id, recruiterId: user._id })
				.then((application) => {
					if (!application) {
						return res.status(404).json({ message: 'Application not found' });
					}

					Job.findOne({ _id: application.jobId, userId: user._id }).then((job) => {
						if (!job) {
							return res.status(404).json({ message: 'Job does not exist' });
						}

						Application.countDocuments({
							recruiterId: user._id,
							jobId: job._id,
							status: 'Accepted'
						}).then((activeApplicationCount) => {
							if (activeApplicationCount < job.maxPositions) {
								application.status = status;
								application.dateOfJoining = dateOfJoining; // Update dateOfJoining

								application
									.save()
									.then(() => {
										Application.updateMany(
											{
												_id: { $ne: application._id },
												userId: application.userId,
												status: {
													$nin: ['Rejected', 'Deleted', 'Cancelled', 'Accepted', 'Finished']
												}
											},
											{ $set: { status: 'Cancelled' } },
											{ multi: true }
										)
											.then(() => {
												Job.findOneAndUpdate(
													{ _id: job._id, userId: user._id },
													{ $set: { acceptedCandidates: activeApplicationCount + 1 } }
												)
													.then(() => res.json({ message: `Application ${status} successfully` }))
													.catch((err) => res.status(400).json(err));
											})
											.catch((err) => res.status(400).json(err));
									})
									.catch((err) => res.status(400).json(err));
							} else {
								res.status(400).json({ message: 'All positions for this job are already filled' });
							}
						});
					});
				})
				.catch((err) => res.status(400).json(err));
		} else {
			Application.findOneAndUpdate(
				{ _id: id, recruiterId: user._id, status: { $nin: ['Rejected', 'Deleted', 'Cancelled'] } },
				{ $set: { status: status } }
			)
				.then((application) => {
					if (!application) {
						return res.status(400).json({ message: 'Application status cannot be updated' });
					}
					res.json({ message: `Application ${status} successfully` });
				})
				.catch((err) => res.status(400).json(err));
		}
	};

	// Function to handle applicant actions
	const handleApplicantActions = () => {
		if (status === 'Cancelled') {
			Application.findOneAndUpdate({ _id: id, userId: user._id }, { $set: { status: status } })
				.then(() => res.json({ message: `Application ${status} successfully` }))
				.catch((err) => res.status(400).json(err));
		} else {
			res.status(401).json({ message: "You don't have permissions to update job status" });
		}
	};

	// Check user type and call appropriate function
	if (user.type === 'recruiter') {
		handleRecruiterActions();
	} else {
		handleApplicantActions();
	}
});

// get a list of final applicants for current job : recruiter
// get a list of final applicants for all his jobs : recuiter
// Get a list of final applicants
router.get('/applicants', jwtAuth, (req, res) => {
	const user = req.user;
	if (user.type === 'recruiter') {
		let findParams = {
			recruiterId: user._id
		};

		if (req.query.jobId) {
			findParams = {
				...findParams,
				jobId: new mongoose.Types.ObjectId(req.query.jobId)
			};
		}

		if (req.query.status) {
			if (Array.isArray(req.query.status)) {
				findParams = {
					...findParams,
					status: { $in: req.query.status }
				};
			} else {
				findParams = {
					...findParams,
					status: req.query.status
				};
			}
		}

		let sortParams = {};

		if (!req.query.asc && !req.query.desc) {
			sortParams = { _id: 1 };
		}

		if (req.query.asc) {
			if (Array.isArray(req.query.asc)) {
				req.query.asc.forEach((key) => {
					sortParams = {
						...sortParams,
						[key]: 1
					};
				});
			} else {
				sortParams = {
					...sortParams,
					[req.query.asc]: 1
				};
			}
		}

		if (req.query.desc) {
			if (Array.isArray(req.query.desc)) {
				req.query.desc.forEach((key) => {
					sortParams = {
						...sortParams,
						[key]: -1
					};
				});
			} else {
				sortParams = {
					...sortParams,
					[req.query.desc]: -1
				};
			}
		}

		Application.aggregate([
			{
				$lookup: {
					from: 'jobapplicantinfos',
					localField: 'userId',
					foreignField: 'userId',
					as: 'jobApplicant'
				}
			},
			{ $unwind: '$jobApplicant' },
			{
				$lookup: {
					from: 'jobs',
					localField: 'jobId',
					foreignField: '_id',
					as: 'job'
				}
			},
			{ $unwind: '$job' },
			{ $match: findParams },
			{ $sort: sortParams },
			{
				$project: {
					userId: 1,
					status: 1,
					skills: 1,
					rating: 1,
					email: 1,
					recruiterId: 1,
					jobId: 1,
					sop: 1,
					resume: 1,
					name: 1,
					bio: 1,
					contactNumber: 1,
					education: 1,
					profile: 1,
					dateOfApplication: 1,
					dateOfJoining: 1, // Ensure this field is included in the response
					jobApplicant: 1,
					job: 1
				}
			}
		])
			.then((applications) => {
				if (applications.length === 0) {
					res.status(404).json({
						message: 'No applicants found'
					});
					return;
				}
				res.json(applications);
			})
			.catch((err) => {
				res.status(400).json(err);
			});
	} else {
		res.status(400).json({
			message: 'You are not allowed to access applicants list'
		});
	}
});

// to add or update a rating [todo: test]
router.put('/rating', jwtAuth, (req, res) => {
	const user = req.user;
	const data = req.body;
	if (user.type === 'recruiter') {
		// can rate applicant
		Rating.findOne({
			senderId: user._id,
			receiverId: data.applicantId,
			category: 'applicant'
		})
			.then((rating) => {
				if (rating === null) {
					//console.log('new rating');
					Application.countDocuments({
						userId: data.applicantId,
						recruiterId: user._id,
						status: {
							$in: ['accepted', 'finished']
						}
					})
						.then((acceptedApplicant) => {
							if (acceptedApplicant > 0) {
								// add a new rating

								rating = new Rating({
									category: 'applicant',
									receiverId: data.applicantId,
									senderId: user._id,
									rating: data.rating
								});

								rating
									.save()
									.then(() => {
										// get the average of ratings
										Rating.aggregate([
											{
												$match: {
													receiverId: mongoose.Types.ObjectId(data.applicantId),
													category: 'applicant'
												}
											},
											{
												$group: {
													_id: {},
													average: { $avg: '$rating' }
												}
											}
										])
											.then((result) => {
												// update the user's rating
												if (result === null) {
													res.status(400).json({
														message: 'Error while calculating rating'
													});
													return;
												}
												const avg = result[0].average;

												JobApplicant.findOneAndUpdate(
													{
														userId: data.applicantId
													},
													{
														$set: {
															rating: avg
														}
													}
												)
													.then((applicant) => {
														if (applicant === null) {
															res.status(400).json({
																message: "Error while updating applicant's average rating"
															});
															return;
														}
														res.json({
															message: 'Rating added successfully'
														});
													})
													.catch((err) => {
														res.status(400).json(err);
													});
											})
											.catch((err) => {
												res.status(400).json(err);
											});
									})
									.catch((err) => {
										res.status(400).json(err);
									});
							} else {
								// you cannot rate
								res.status(400).json({
									message: "Applicant didn't worked under you. Hence you cannot give a rating."
								});
							}
						})
						.catch((err) => {
							res.status(400).json(err);
						});
				} else {
					rating.rating = data.rating;
					rating
						.save()
						.then(() => {
							// get the average of ratings
							Rating.aggregate([
								{
									$match: {
										receiverId: mongoose.Types.ObjectId(data.applicantId),
										category: 'applicant'
									}
								},
								{
									$group: {
										_id: {},
										average: { $avg: '$rating' }
									}
								}
							])
								.then((result) => {
									// update the user's rating
									if (result === null) {
										res.status(400).json({
											message: 'Error while calculating rating'
										});
										return;
									}
									const avg = result[0].average;
									JobApplicant.findOneAndUpdate(
										{
											userId: data.applicantId
										},
										{
											$set: {
												rating: avg
											}
										}
									)
										.then((applicant) => {
											if (applicant === null) {
												res.status(400).json({
													message: "Error while updating applicant's average rating"
												});
												return;
											}
											res.json({
												message: 'Rating updated successfully'
											});
										})
										.catch((err) => {
											res.status(400).json(err);
										});
								})
								.catch((err) => {
									res.status(400).json(err);
								});
						})
						.catch((err) => {
							res.status(400).json(err);
						});
				}
			})
			.catch((err) => {
				res.status(400).json(err);
			});
	} else {
		// applicant can rate job
		Rating.findOne({
			senderId: user._id,
			receiverId: data.jobId,
			category: 'job'
		})
			.then((rating) => {
				// console.log(user._id);
				// console.log(data.jobId);
				// console.log(rating);
				if (rating === null) {
					//console.log(rating);
					Application.countDocuments({
						userId: user._id,
						jobId: data.jobId,
						status: {
							$in: ['accepted', 'finished']
						}
					})
						.then((acceptedApplicant) => {
							if (acceptedApplicant > 0) {
								// add a new rating

								rating = new Rating({
									category: 'job',
									receiverId: data.jobId,
									senderId: user._id,
									rating: data.rating
								});

								rating
									.save()
									.then(() => {
										// get the average of ratings
										Rating.aggregate([
											{
												$match: {
													receiverId: mongoose.Types.ObjectId(data.jobId),
													category: 'job'
												}
											},
											{
												$group: {
													_id: {},
													average: { $avg: '$rating' }
												}
											}
										])
											.then((result) => {
												if (result === null) {
													res.status(400).json({
														message: 'Error while calculating rating'
													});
													return;
												}
												const avg = result[0].average;
												Job.findOneAndUpdate(
													{
														_id: data.jobId
													},
													{
														$set: {
															rating: avg
														}
													}
												)
													.then((foundJob) => {
														if (foundJob === null) {
															res.status(400).json({
																message: "Error while updating job's average rating"
															});
															return;
														}
														res.json({
															message: 'Rating added successfully'
														});
													})
													.catch((err) => {
														res.status(400).json(err);
													});
											})
											.catch((err) => {
												res.status(400).json(err);
											});
									})
									.catch((err) => {
										res.status(400).json(err);
									});
							} else {
								// you cannot rate
								res.status(400).json({
									message: "You haven't worked for this job. Hence you cannot give a rating."
								});
							}
						})
						.catch((err) => {
							res.status(400).json(err);
						});
				} else {
					// update the rating
					rating.rating = data.rating;
					rating
						.save()
						.then(() => {
							// get the average of ratings
							Rating.aggregate([
								{
									$match: {
										receiverId: mongoose.Types.ObjectId(data.jobId),
										category: 'job'
									}
								},
								{
									$group: {
										_id: {},
										average: { $avg: '$rating' }
									}
								}
							])
								.then((result) => {
									if (result === null) {
										res.status(400).json({
											message: 'Error while calculating rating'
										});
										return;
									}
									const avg = result[0].average;
									//console.log(avg);

									Job.findOneAndUpdate(
										{
											_id: data.jobId
										},
										{
											$set: {
												rating: avg
											}
										}
									)
										.then((foundJob) => {
											if (foundJob === null) {
												res.status(400).json({
													message: "Error while updating job's average rating"
												});
												return;
											}
											res.json({
												message: 'Rating added successfully'
											});
										})
										.catch((err) => {
											res.status(400).json(err);
										});
								})
								.catch((err) => {
									res.status(400).json(err);
								});
						})
						.catch((err) => {
							res.status(400).json(err);
						});
				}
			})
			.catch((err) => {
				res.status(400).json(err);
			});
	}
});

// get personal rating
router.get('/rating', jwtAuth, (req, res) => {
	const user = req.user;
	Rating.findOne({
		senderId: user._id,
		receiverId: req.query.id,
		category: user.type === 'recruiter' ? 'applicant' : 'job'
	}).then((rating) => {
		if (rating === null) {
			res.json({
				rating: -1
			});
			return;
		}
		res.json({
			rating: rating.rating
		});
	});
});

// Application.findOne({
//   _id: id,
//   userId: user._id,
// })
//   .then((application) => {
//     application.status = status;
//     application
//       .save()
//       .then(() => {
//         res.json({
//           message: `Application ${status} successfully`,
//         });
//       })
//       .catch((err) => {
//         res.status(400).json(err);
//       });
//   })
//   .catch((err) => {
//     res.status(400).json(err);
//   });

// router.get("/jobs", (req, res, next) => {
//   passport.authenticate("jwt", { session: false }, function (err, user, info) {
//     if (err) {
//       return next(err);
//     }
//     if (!user) {
//       res.status(401).json(info);
//       return;
//     }
//   })(req, res, next);
// });

module.exports = router;
