const express = require('express');
const router = express.Router();
const path = require('path');
const pool = require('../config/database');

router.get('/', (req, res, next) => {
    res.sendFile(path.join(__dirname, '..', 'pages', 'dashboard.html'));
});

router.get('/data', (req, res, next) => {
    // Retrieve email from cookie
    const useremail = req.cookies.email;
    console.log('useremail');

    const sqlQuery = `
    SELECT t.team_name, p.project_name, p.category, p.duration_months
    FROM project.teams AS t
    JOIN project.project AS p ON t.project_one_id = p.project_id OR t.project_two_id = p.project_id
    WHERE ? IN (t.member_1, t.member_2, t.member_3, t.member_4, t.member_5)
`;

// SQL query to fetch user details
const query_of_user = `
    SELECT user_email, user_name, Department
    FROM project.sign_log
    WHERE user_email = ?
`;

    // Execute the query to fetch project information
    pool.query(sqlQuery, [useremail], (err, projectResult) => {
        if (err) {
            console.error('Error executing SQL query for projects:', err);
            return res.status(500).send('Internal Server Error');
        }

        // Execute the query to fetch user details
        pool.query(query_of_user, [useremail], (userErr, userResult) => {
            if (userErr) {
                console.error('Error executing SQL query for user:', userErr);
                return res.status(500).send('Internal Server Error');
            }

            // Assuming 'projectResult' contains the resultSet for projects
            // Assuming 'userResult' contains the resultSet for the user details
            const userDetails = userResult[0]; // Assuming there's only one user with the given email

            // Send the JSON response with the project information and user details
            res.json({
                projects: projectResult,
                user: userDetails
            });
        });
    });
});

module.exports = router;