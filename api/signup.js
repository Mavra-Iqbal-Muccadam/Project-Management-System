const express = require('express');
const router = express.Router();
const path = require('path');
const pool = require('../config/database');

router.get('/', (req, res, next) => {
    res.sendFile(path.join(__dirname, '..', 'pages', 'signup.html'));
});


router.post('/',(req,res,next)=>{
    const { username, user_email,department, user_password, confirm_password } = req.body;
    console.log('Form Data Received:');
    console.log('Username:', username);
    console.log('Email:', user_email);
    console.log('Department:', department);
    console.log('Password:', user_password);
    console.log('Confirm Password:', confirm_password);



function getRandomTwoLetters(str) {
    // If the string length is less than 2, return the string itself
    if (str.length < 2) {
        return str;
    }

    // Generate two random indices
    const index1 = Math.floor(Math.random() * str.length);
    let index2 = Math.floor(Math.random() * str.length);

    // Ensure the two indices are different
    while (index2 === index1) {
        index2 = Math.floor(Math.random() * str.length);
    }

    return str[index1] + str[index2];
}

function generateUserId(userName, department) {
    const randomLettersFromUserName = getRandomTwoLetters(userName);
    const randomLettersFromDepartment = getRandomTwoLetters(department);

    const currentTimeInSeconds = Math.floor(Date.now() / 1000);
    // Get the last 4 digits of the current time
    const timeString = currentTimeInSeconds.toString().slice(-4);

    const remainingLength = 6 - (randomLettersFromUserName.length + randomLettersFromDepartment.length);
    const timeSubstring = timeString.slice(0, remainingLength);

    const userId = randomLettersFromUserName + randomLettersFromDepartment + timeSubstring;

    return userId;
}

user_id = generateUserId(username,department);


// Check if username already exists
pool.query('SELECT * FROM project.sign_log WHERE user_name = ?', [username], (error, results) => {
    if (error) {
        console.error(error);
        return res.status(500).json({ success: 0, message: 'Server error' });
    }
    if (results.length > 0) {
        return res.status(400).json({ success: 0, errors: { username: 'Username already chosen' } });
    }
    

    // Check if email already exists
    pool.query('SELECT * FROM project.sign_log WHERE user_email = ?', [user_email], (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ success: 0, message: 'Server error' });
        }
        if (results.length > 0) {
            return res.status(400).json({ success: 0, errors: { email: 'Email already exists' } });
        }
        
        

        // If both username and email are unique, execute the insert query
        pool.query('INSERT INTO project.sign_log (user_id,user_name, user_email, user_password, confirm_password, Department) VALUES (?,?, ?, ?, ?, ?)', [user_id,username, user_email, user_password, confirm_password, department], (error, results) => {
            if (error) {
                console.error(error);
                return res.status(500).json({ success: 0, message: 'Server error' });
            }
            res.status(200).json({ success: 1, message: 'Registration successful' });
        });
    });
});
});

module.exports = router;