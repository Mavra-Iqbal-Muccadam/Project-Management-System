const express = require('express');
const router = express.Router();
const path = require('path');
const pool = require('../config/database');


router.get('/', (req, res, next) => {
    res.sendFile(path.join(__dirname, '..', 'pages', 'login.html'));
});


router.post('/', (req, res, next) => {
    const user_email = req.body.useremail;
    const user_password = req.body.password;
    console.log(user_email, user_password);

    pool.query('SELECT * FROM project.sign_log WHERE user_email = ? AND user_password = ?', [user_email, user_password], (error, results) => {
        if (error) {
            console.error(error);
            res.status(500).json({ success: 0, message: 'Server error' });
        } else {
            if (results.length > 0) {
                // Set cookie upon successful login
                res.cookie('email', user_email, { maxAge: 900000, httpOnly: true }); // Adjust maxAge as per your requirement
                
                res.status(200).json({ success: 1, message: ' successful' });

            } else {
                res.status(401).json({ success: 0, message: 'Invalid username or password' });

            }
        }
    });
});

module.exports = router;
