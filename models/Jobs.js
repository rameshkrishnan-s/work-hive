const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    jobTitle: {
        type: String,
        required: true,
    },
    companyName: {
        type: String,
        required: true,
    },
    jobDescription: {
        type: String,
        required: true,
    },
    contactEmail: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true, // Make location required if necessary
    },
    jobType: {
        type: String,
        required: true, // Make jobType required if necessary
    },
    salary: {
        type: Number,
        required: true, // Make salary required if necessary
    },
    postedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: true,
    },
}, { timestamps: true }); // Automatically manage createdAt and updatedAt timestamps

module.exports = mongoose.model('Job', jobSchema);
