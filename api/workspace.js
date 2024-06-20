const express = require('express');
const router = express.Router();
const path = require('path');
const pool = require('../config/database');


router.get('/', (req, res, next) => {
    res.sendFile(path.join(__dirname, '..', 'pages', 'workspace.html'));
});


router.post('/check-email', (req, res) => {
    const email = req.body.email;
    const query = 'SELECT COUNT(*) AS count FROM project.sign_log WHERE user_email = ?';

    pool.query(query, [email], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            res.status(500).json({ error: 'Database error' });
            return;
        }

        const emailExists = results[0].count > 0;
        res.json({ message: emailExists ? 'Email exists' : 'Email does not exist' });
    });
});


router.get('/suggestions', (req, res) => {
    const { query } = req.query;

    // Use the query parameter to fetch suggestions from the database
    const queryString = `
        SELECT team_name
        FROM teams
        WHERE team_name LIKE ?
        AND (Project_one_id IS NULL OR Project_two_id IS NULL)
    `;
    const searchQuery = '%' + query + '%'; // Add wildcard to search for partial matches
    pool.query(queryString, [searchQuery], (err, results) => {
        if (err) {
            console.error('Error fetching suggestions:', err);
            res.status(500).json({ error: 'Database error' });
        } else {
            // Extract team names from the query results
            const suggestions = results.map(result => result.team_name);
            res.json(suggestions); // Send the suggestions back to the client
        }
    });
});








router.post('/check_email', (req, res) => {
    const { email } = req.body; // Retrieve email from req.body instead of req.query
    console.log(email);
    // Use the query parameter to check if the email exists in the database
    const queryString = `
        SELECT COUNT(*) AS count
        FROM project.sign_log
        WHERE user_email = ?
    `;
    
    pool.query(queryString, [email], (err, results) => {
        if (err) {
            console.error('Error checking email existence:', err);
            res.status(500).json({ error: 'Database error' });
        } else {
            console.log(results); // Log the results to see what data is returned from the database
            const count = results[0].count;
            res.json({ exists: count > 0 }); // Send whether email exists back to the client
        }
    });
});














router.post('/create', (req, res) => {
    // Extract data from the request body
    const { projectName, projectDescription, projectCategory, projectLead, leadEmail, projectCost, estimatedBudget, team, startDate, endDate } = req.body;
    

    const duration = calculateDuration(startDate, endDate);
    
    // Log the received data
    console.log('Received data from frontend:');
    console.log('Project Name:', projectName);
    console.log('Project Description:', projectDescription);
    console.log('Project Category:', projectCategory);
    console.log('Project Lead:', projectLead);
    console.log('Lead Email:', leadEmail);
    console.log('Project Cost:', projectCost);
    console.log('Estimated Budget:', estimatedBudget);
    console.log('Team:', JSON.stringify(team));
    console.log('Start Date:', startDate);
    console.log('End Date:', endDate);

    // Generate project ID
    const projectId = generateProjectId(projectName, projectCategory);
    console.log('Generated Project ID:', projectId);

    // Insert project details into the database
    const insertQuery = "INSERT INTO project.project (project_id, project_name, project_description, category, lead_name, lead_email, cost, budget, start_date, expected_end_date,team,duration,duration_months) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?,?)";
    const insertValues = [projectId, projectName, projectDescription, projectCategory, projectLead, leadEmail, projectCost, estimatedBudget, startDate, endDate,JSON.stringify(team),duration.days,duration.months ];
    
    pool.query(insertQuery, insertValues, (insertErr, insertResults) => {
        if (insertErr) {
            console.error('Error inserting project details:', insertErr);
            res.status(500).json({ error: 'Database error' });
            return;
        }

        console.log('Project details inserted successfully');

        const updateLeadQuery = "UPDATE project.sign_log SET islead = 'yes' WHERE user_email = ?";

        pool.query(updateLeadQuery, [leadEmail], (updateLeadErr, updateLeadResults) => {
            if (updateLeadErr) {
                console.error('Error updating islead column:', updateLeadErr);
                res.status(500).json({ error: 'Database error' });
                return;
            }

            console.log('islead column updated successfully');



        // Update team's Project_one_id or Project_two_id
        insertProjectIds(team, projectId, (updateErr) => {
            if (updateErr) {
                console.error('Error updating teams:', updateErr);
                res.status(500).json({ error: 'Database error' });
                return;
            }

            console.log('Teams updated successfully');
             
            res.json({ message: 'Project created successfully' });
        });
    });
    });
});
function calculateDuration(startDate, expectedEndDate) {
    // Parse the dates
    const start = new Date(startDate);
    const end = new Date(expectedEndDate);

    // Calculate the difference in milliseconds
    const differenceMs = end - start;

    // Calculate the number of days
    const days = Math.floor(differenceMs / (1000 * 60 * 60 * 24));

    // Calculate the number of months
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());

    return { days, months };
}






function insertProjectIds(teamArray, projectId, callback) {
    teamArray.forEach(teamName => {
        const selectQuery = "SELECT Project_one_id FROM project.teams WHERE team_name = ?";
        pool.query(selectQuery, [teamName], (selectErr, selectResults) => {
            if (selectErr) {
                callback(selectErr);
                return;
            }
            if (selectResults.length === 0) {
                console.log("No record found for team: " + teamName);
                return;
            }
            
            const Project_one_id = selectResults[0].Project_one_id;
            let updateQuery;
            if (Project_one_id == null) {
                updateQuery = "UPDATE project.teams SET Project_one_id = ? WHERE team_name = ?";
            } else {
                updateQuery = "UPDATE project.teams SET Project_two_id = ? WHERE team_name = ?";
            }
            
            pool.query(updateQuery, [projectId, teamName], (updateErr, updateResults) => {
                if (updateErr) {
                    callback(updateErr); // Pass error to callback
                    return;
                }
                console.log('Update successful for team: ' + teamName);
            });
        });
    });
    callback(null); // No error
}

function generateProjectId(projectName, projectCategory) {
    const now = new Date();
    const currentSecond = String(now.getSeconds()).padStart(2, '0'); // Get current seconds, padded to 2 digits

    // Helper function to get random characters from a string
    function getRandomChars(str, num) {
        let result = '';
        for (let i = 0; i < num; i++) {
            const randomIndex = Math.floor(Math.random() * str.length);
            result += str[randomIndex];
        }
        return result;
    }

    const randomNameChars = getRandomChars(projectName, 2); // Get 2 random characters from project name
    const randomCategoryChars = getRandomChars(projectCategory, 2); // Get 2 random characters from project category

    const projectId = currentSecond + randomNameChars + randomCategoryChars;
    return projectId.toUpperCase(); // Convert to uppercase for consistency
}


router.post('/check-project-name', (req, res) => {
    const projectName = req.body.projectName;

    // SQL query to check if the project name already exists
    const sqlQuery = 'SELECT COUNT(*) AS count FROM project.project WHERE project_name = ?';

    // Execute the SQL query
    pool.query(sqlQuery, [projectName], (error, results) => {
        if (error) {
            console.error('Error checking project name:', error);
            res.status(500).json({ error: 'Database error' });
            return;
        }

        const exists = results[0].count > 0;
        res.json({ exists: exists });
    });
});

    
module.exports = router;