const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const session = require('express-session');
const User = require('./models/User');
const Job = require('./models/Jobs');
const os = require('os');

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// Session setup
app.use(session({
    secret: 'your-secret-key', // Change this to a secure random key
    resave: false,
    saveUninitialized: true
}));

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/jobPortal', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Middleware to check if user is logged in
const isLoggedIn = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login'); // Redirect to login if not logged in
    }
};

// Routes
app.get('/', (req, res) => {
    if (req.session.user) {
        return res.redirect('/home'); // Redirect to home if already logged in
    }
    res.render('index', { message: null });
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user) {
        return res.render('index', { message: 'User already exists. Please log in.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
        username,
        password: hashedPassword
    });

    await newUser.save();
    res.redirect('/login');
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
        return res.render('index', { message: 'User not found. Please register.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.render('index', { message: 'Incorrect password. Try again.' });
    }

    // Set session
    req.session.user = user;
    res.redirect('/home');
});

// Protected route for logged-in users
app.get('/home', isLoggedIn, (req, res) => {
    res.render('home', { username: req.session.user.username });
});

// Jobs route with filtering
app.get('/jobs', isLoggedIn, async (req, res) => {
    const { location, jobType } = req.query;
    let filter = {};
    
    if (location) {
        filter.location = new RegExp(location, 'i'); // Case-insensitive search
    }

    if (jobType) {
        filter.jobType = jobType;
    }

    const jobs = await Job.find(filter).populate('postedBy', 'username'); // Get filtered jobs with user info
    res.render('jobs', { jobs }); // Pass jobs to the view
});

// Job posting route
app.get('/post-jobs', isLoggedIn, (req, res) => {
    res.render('post-jobs'); // Render the job posting form
});

// Route to handle job submission
app.post('/submit-job', isLoggedIn, async (req, res) => {
    const { jobTitle, companyName, jobDescription, contactEmail, location, jobType, salary } = req.body;
    const newJob = new Job({
        jobTitle,
        companyName,
        jobDescription,
        contactEmail,
        location,
        jobType,
        salary,
        postedBy: req.session.user._id // Associate the job with the logged-in user
    });

    await newJob.save(); // Save the job to the database
    res.redirect('/jobs'); // Redirect to the jobs page after submission
});

// Route to apply for a job
app.get('/apply-job/:jobId', isLoggedIn, async (req, res) => {
    const jobId = req.params.jobId;
    const job = await Job.findById(jobId).populate('postedBy', 'username'); // Fetch the job details
    res.render('apply-job', { job }); // Render the application form for the specific job
});

// Route to handle application submission
app.post('/submit-application/:jobId', isLoggedIn, async (req, res) => {
    const jobId = req.params.jobId;
    const { applicantName, applicantEmail, applicantMessage } = req.body;

    // Log the application submission data (here you can also save it to a database)
    console.log(`Application submitted for Job ID: ${jobId} by ${applicantName}, Email: ${applicantEmail}, Message: ${applicantMessage}`);

    res.redirect('/jobs'); // Redirect back to the jobs page after submission
});

// Other routes
app.get('/about-us', isLoggedIn, (req, res) => {
    res.render('about-us'); // Render About Us page
});

app.get('/contact-us', isLoggedIn, (req, res) => {
    res.render('contact-us'); // Render Contact Us page
});

// Handle contact form submission
app.post('/send-message', isLoggedIn, (req, res) => {
    const { name, email, message } = req.body;
    console.log(`Contact Message from: ${name}, Email: ${email}, Message: ${message}`);
    res.redirect('/contact-us'); // Redirect back to the contact page after submission
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Function to get the local network IP address
const getLocalIP = () => {
    const interfaces = os.networkInterfaces();
    for (const interfaceName in interfaces) {
        for (const net of interfaces[interfaceName]) {
            // Ignore internal (i.e., 127.0.0.1) and non-ipv4 addresses
            if (net.family === 'IPv4' && !net.internal) {
                return net.address; // Return the first valid IPv4 address
            }
        }
    }
    return 'IP not found';
};

// Log the local IP address when the server starts
const localIP = getLocalIP();
app.listen(3000, '0.0.0.0', () => {
    console.log(`Server is running on port 3000`);
    console.log(`Access it at http://${localIP}:3000`);
});
