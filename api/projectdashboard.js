const express = require('express');
const router = express.Router();
const path = require('path');
const pool = require('../config/database');

router.get('/', (req, res, next) => {
    res.sendFile(path.join(__dirname, '..', 'pages', 'projectdashboard.html'));
});


router.post('/getprojectdetails', (req, res, next) => {
    const projectName = req.body.projectName;
    const sqlQuery = `
        SELECT project_name, start_date, expected_end_date, category, lead_name, project_description
        FROM project
        WHERE project_name = ?
    `;

    pool.query(sqlQuery, [projectName], (error, results, fields) => {
        if (error) {
            console.error('Error executing SQL query:', error);
            res.status(500).json({ error: 'Error fetching project details' });
        } else {
            if (results.length > 0) {
                const projectDetails = results[0];
                res.json(projectDetails);
            } else {
                res.status(404).json({ message: 'Project not found' });
            }
        }
    });
});

module.exports = router;
