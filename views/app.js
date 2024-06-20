require("dotenv").config()
const express = require('express')
const cookieParser = require('cookie-parser');
const multer = require('multer');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const upload = multer();
const router = express.Router();
const loginRoutes = require('../api/log.js');
const SignupRoutes = require('../api/signup.js');
const teamRoutes = require('../api/team.js');
const workspaceRoutes = require('../api/workspace.js');
const landingRoutes = require('../api/landing.js');
const dashboard = require('../api/dashboard.js');
const projectdashboard = require('../api/projectdashboard.js');
const projectbudget = require('../api/budget.js');
const projectrisk = require('../api/risk.js');


// const logic = require('logic.js');
const pool = require('../config/database');

app.use(express.static(path.join(__dirname,'..', 'pages')));   //yahan changes ki
app.use('/pictures', express.static(path.join(__dirname, '..', 'pictures')));
app.use(cookieParser());
app.use(bodyParser.json());

app.get("/api",(req,res)=>{
    res.json({
        success:1,
        message:"The api is working"
    })
})


// app.use(bodyParser.json());

// Middleware to parse URL-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


app.use('/login', loginRoutes);
app.use('/signup', SignupRoutes);
app.use('/team', teamRoutes);
app.use('/workspace', workspaceRoutes);
app.use('/landing', landingRoutes);
app.use('/dashboard', dashboard);
app.use('/projectdashboard', projectdashboard);
app.use('/projectbudget', projectbudget);
app.use('/projectrisk', projectrisk);





app.listen(process.env.APP_PORT,()=>{
    console.log("server is running on port ", process.env.APP_PORT);
});