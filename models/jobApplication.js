const mongoose = require('mongoose')

const jobApplicationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    phone: {
      type: Number,
      required: true
    },
    jobId: {
      type: mongoose.Types.ObjectId,
      ref: 'Job',
      required: true
    },
    email: {
      type: String,
      required: true
    },
    age: {
      type: Number,
      required: true
    },
    experience: {
      type: Number,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    pincode: {
      type: Number,
      required: true
    },
    aadharNo: {
      type: Number,
      required: true
    },
    panNo: {
      type: String,
      required: true
    },
    ReferencePerson: {
      type: String,
    },
    ModeofTransport: {
      type: String,
      required: true
    },
    salary: {
      type: Number,
      required: true
    }
  },
  { timestamps: true }
)

module.exports = mongoose.model('JobApplication', jobApplicationSchema)
