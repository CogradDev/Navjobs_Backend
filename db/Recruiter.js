const mongoose = require("mongoose");

let schema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User' // Assuming there is a User model for referencing
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
    
    contactNumber: {
      type: String,
      validate: {
        validator: function (v) {
          return v !== "" ? /\+\d{1,3}\d{10}/.test(v) : true;
        },
        msg: "Phone number is invalid!",
      },
    },
    bio: {
      type: String,
    },
    companyName: {
      type: String,
  
    },
    location: {
      type: String,

    },
    industry: {
      type: String,

    },
    companyDescription: {
      type: String,

    },
    contactInformation: {
      email: {
        type: String,
  
        validate: {
          validator: function (v) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
          },
          msg: "Email is invalid!",
        },
      },
    },
  },
  { collation: { locale: "en" } }
);

module.exports = mongoose.model("RecruiterInfo", schema);
