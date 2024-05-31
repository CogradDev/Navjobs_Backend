const mongoose = require("mongoose");

let schema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["recruiter", "applicant"],
      required: true,
    },
    bio: {
      type: String,
    },
    contactNumber: {
      type: String,
      validate: {
        validator: function (v) {
          return /\+\d{1,4}\d{10}/.test(v); // Example validation for phone number with country code
        },
        message: "Invalid contact number",
      },
    },
    education: [
      {
        institutionName: {
          type: String,
          required: true,
        },
        startDate: {
          type: Date,
          required: true,
        },
        endDate: {
          type: Date,
          validate: {
            validator: function (value) {
              return this.startDate <= value;
            },
            message: "End date should be greater than or equal to start date",
          },
        },
      },
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
        message: "Invalid rating",
      },
    },
    resume: {
      type: String,
      required: true,
    },
    profile: {
      type: String,
    },
  },
  { collation: { locale: "en" } }
);

module.exports = mongoose.model("JobApplicantInfo", schema);