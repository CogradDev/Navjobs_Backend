const mongoose = require('mongoose');

let schema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    status: {
      type: String,
      enum: [
        'Applied', // when a applicant is applied
        'Shortlisted', // when a applicant is shortlisted
        'Accepted', // when a applicant is accepted
        'Rejected', // when a applicant is rejected
        'Deleted', // when any job is deleted
        'Cancelled', // an application is cancelled by its author or when other application is accepted
        'Finished' // when job is over
      ],
      default: 'Applied',
      required: true
    },
    dateOfApplication: {
      type: Date,
      default: Date.now
    },
    dateOfJoining: {
      type: Date,
      validate: [
        {
          validator: function (value) {
            return this.dateOfApplication <= value;
          },
          msg: 'dateOfJoining should be greater than dateOfApplication'
        }
      ]
    },
    resume: {
      type: String,
      required: true
    },
    sop: {
      type: String,
      validate: {
        validator: function (v) {
          return v.split(' ').filter((ele) => ele != '').length <= 250;
        },
        msg: 'Statement of purpose should not be greater than 250 words'
      }
    },
    name: {
      type: String,
      required: true
    },
    bio: {
      type: String
    },
    email: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: "Invalid email address"
      }
    },
    contactNumber: {
      type: String,
      validate: {
        validator: function (v) {
          return /\+\d{1,4}\d{10}/.test(v); // Example validation for phone number with country code
        },
        message: "Invalid contact number"
      }
    },
    education: [
      {
        institutionName: {
          type: String,
          required: true
        },
        startDate: {
          type: Date,
          required: true
        },
        endDate: {
          type: Date,
          validate: {
            validator: function (value) {
              return this.startDate <= value;
            },
            message: "End date should be greater than or equal to start date"
          }
        }
      }
    ],
    skills: [String],
    rating: {
      type: Number,
      max: 5.0,
      default: -1.0,
      validate: {
        validator: function (v) {
          return v >= -1.0 && v <= 5.0;
        },
        message: "Invalid rating"
      }
    },
    profile: {
      type: String
    }
  },
  { collation: { locale: 'en' } }
);

// schema.virtual("applicationUser", {
//   ref: "JobApplicantInfo",
//   localField: "userId",
//   foreignField: "userId",
//   justOne: true,
// });

// schema.virtual("applicationRecruiter", {
//   ref: "RecruiterInfo",
//   localField: "recruiterId",
//   foreignField: "userId",
//   justOne: true,
// });

// schema.virtual("applicationJob", {
//   ref: "jobs",
//   localField: "jobId",
//   foreignField: "_id",
//   justOne: true,
// });

module.exports = mongoose.model('applications', schema);
