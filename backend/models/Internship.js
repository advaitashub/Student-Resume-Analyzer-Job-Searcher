const mongoose = require("mongoose");

const internshipSchema = new mongoose.Schema({

  title: {
    type: String,
    required: true,
  },

  company: {
    type: String,
    required: true,
  },

  skills: [
    {
      type: String,
    },
  ],

});

module.exports = mongoose.model(
  "Internship",
  internshipSchema
);