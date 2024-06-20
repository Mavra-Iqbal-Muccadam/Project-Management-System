const express = require('express');
const router = express.Router();
const path = require('path');
const pool = require('../config/database');

router.get('/', (req, res, next) => {
    res.sendFile(path.join(__dirname, '..', 'pages', 'team.html'));
});

router.post('/check-email', (req, res) => {
    const email = req.body.email;
    const selectedDepartment = req.body.department; // Assuming you're sending the selected department from the frontend

    // Query to check if the email exists in the database and if its department matches the selected department
    const query = 'SELECT COUNT(*) AS count FROM project.sign_log WHERE user_email = ? AND Department = ?';
    pool.query(query, [email, selectedDepartment], (err, results) => {
        if (err) {
            console.error('Error querying database: ' + err.stack);
            res.status(500).send('Internal Server Error');
            return;
        }

        // Check if email exists and department matches
        const count = results[0].count;
        if (count > 0) {
            res.send(''); // Send empty response if email exists and department matches
        } else {
            res.send('User not found.'); // Send message if email does not exist or department does not match
        }
    });
});


router.post('/submit', (req, res, next) => {
    const { team_name, department, member_email } = req.body;

    // Function to generate a 6-character key for team ID
function generateTeamID(teamName, department) {
    // Get the current second digit
    const currentSecond = new Date().getSeconds() % 10; // Ensure it's a single digit

    // Select two random characters from the team name
    const teamNameChars = teamName.replace(/ /g, ''); // Remove spaces
    const randomTeamChars = getRandomChars(teamNameChars, 2);

    // Select two random characters from the department
    const randomDeptChars = getRandomChars(department, 2);

    // Concatenate all components to form the team ID
    const teamID = currentSecond.toString() + randomTeamChars + randomDeptChars;

    return teamID;
}

// Function to select random characters from a string
function getRandomChars(str, count) {
    let randomChars = '';
    const strLength = str.length;
    for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * strLength);
        randomChars += str[randomIndex];
    }
    return randomChars;
}



const teamID = generateTeamID(team_name, department);
console.log('Generated Team ID:', teamID);


    // Determine the number of members provided in the form
    const numMembers = member_email.length;

    // Construct the SQL query dynamically
    let sql = `INSERT INTO teams (team_id,team_name, Department`;

    // Append member fields to the SQL query
    for (let i = 0; i < numMembers; i++) {
        sql += `, member_${i + 1}`;
    }

    sql += `) VALUES (?,?, ?`;

    // Append placeholders for member values to the SQL query
    for (let i = 0; i < numMembers; i++) {
        sql += `, ?`;
    }

    sql += `)`;

    // Extract values from the request body
    const values = [teamID,team_name, department, ...member_email];

    // Execute the SQL query
    pool.query(sql, values, (error, results) => {
        if (error) {
            console.error(error);
            res.status(500).json({ success: 0, message: 'Server error' });
        } else {
            res.status(200).json({ success: 1, message: 'Data inserted successfully' });
        }
    });
});




// Route to handle AJAX request for checking team name availability
router.post('/check-team-name', (req, res) => {
    const teamName = req.body.teamName;
    console.log('Team Name received:', teamName); // Add this line to log the teamName

    // SQL query to check if the team name already exists
    const sqlQuery = 'SELECT * FROM project.teams WHERE team_name = ?';

    // Execute the SQL query
    pool.query(sqlQuery, [teamName], (error, results) => {
        if (error) {
            console.error('Error checking team name:', error);
            res.status(500).send('Internal Server Error');
        } else {
            console.log('Results:', results); // Add this line to log the results
            if (results.length > 0) {
                // If team name exists, send back a message indicating unavailability
                res.send('Team name already exists. Please choose a different name.');
            } else {
                // If team name doesn't exist, send back an empty response indicating availability
                res.send('');
            }
        }
    });
});

module.exports = router;
