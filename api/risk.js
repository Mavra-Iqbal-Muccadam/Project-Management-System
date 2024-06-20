const express = require('express');
const router = express.Router();
const path = require('path');
const pool = require('../config/database');



router.get('/', async(req, res, next) => {
    res.sendFile(path.join(__dirname, '..', 'pages', 'risk.html'));
});


// async function getRisksByProjectId(projectId) {
//     const query = 'SELECT description, Priority FROM project.risk WHERE project_id = ?';
//     const values = [projectId];

//     try {
//         const res = await pool.query(query, values);
//         console.log('Query Result:', res); // Log the result to inspect it
//         return res.rows; // Assuming `res.rows` contains the fetched rows
//     } catch (err) {
//         console.error('Error executing query', err.stack);
//         throw err;
//     }
// }

function getProjectIdByName(projectName, callback) {
    const query = 'SELECT project_Id FROM project.project WHERE project_name = ?';
    pool.query(query, [projectName], (error, results) => {
        if (error) {
            console.error('Error executing query:', error);
            callback(error, null);
            return;
        }

        console.log('Raw Query Response:', results);
        
        if (results.length > 0) {
            callback(null, results[0].project_Id); // Use project_Id instead of project_id
        } else {
            callback(null, null); // No project found
        }
    });
}



// Endpoint to fetch risk details
router.get('/risk', async (req, res) => {
    const projectName = req.query.projectName;
    console.log('Received project name:', projectName); // Log the received project name

    if (!projectName) {
        return res.status(400).json({ error: 'Project name is required' });
    }

    getProjectIdByName(projectName, async (error, projectId) => {
        if (error) {
            return res.status(500).send('Error fetching project ID');
        }

        if (!projectId) {
            return res.status(404).send('Project not found');
        }

        console.log('Fetched project ID:', projectId); // Log the fetched project ID

        const sqlQuery = `
            SELECT description, Priority
            FROM risk
            WHERE project_id = ?
        `;

        pool.query(sqlQuery, [projectId], (error, results, fields) => {
            if (error) {
                console.error('Error executing SQL query:', error);
                res.status(500).json({ error: 'Error fetching risk details' });
            } else {
                if (results.length > 0) {
                    // Format the fetched risk details into an array of objects
                    const riskDetails = results.map(row => {
                        return {
                            description: row.description,
                            priority: row.Priority // Note: property name should be lowercase "priority" for consistency
                        };
                    });
                    console.log('Fetched risk details:', riskDetails); // Log the fetched risk details
                    res.json(riskDetails);
                } else {
                    res.status(404).json({ message: 'Risk details not found' });
                }
            }
        });
    });
});










router.post('/newrisk', (req, res) => {
    const { riskName, priority, projectName } = req.body;
    console.log('Received Risk:', { riskName, priority });

    // Fetch project ID based on project name
    const projectIdQuery = 'SELECT project_id FROM project.project WHERE project_name = ?';
    pool.query(projectIdQuery, [projectName], (err, results) => {
        if (err) {
            console.error('Error fetching project ID:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (results.length > 0) {
            const projectId = results[0].project_id;
            console.log('Project ID:', projectId);

            // Now you have the project ID, you can use it for further processing
            const risk_id = generateRiskId(riskName, projectName);
            const insertQuery = `
                INSERT INTO project.risk (risk_id, project_id, description, Priority, date)
                VALUES (?, ?, ?, ?, CURRENT_DATE())`;
            pool.query(insertQuery, [risk_id, projectId, riskName, priority], (error, results) => {
                if (error) {
                    console.error('Error inserting risk:', error);
                    return res.status(500).json({ error: 'Database error' });
                }

                console.log('Risk inserted successfully');
                res.json({ message: 'Risk inserted successfully', riskId: risk_id });
            });
        } else {
            console.log('Project not found for name:', projectName);
            res.status(404).json({ error: 'Project not found' });
        }
    });
});


// Function to generate risk ID
function generateRiskId(projectName, projectCategory) {
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
module.exports = router;
