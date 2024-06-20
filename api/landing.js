const express = require('express');
const router = express.Router();
const path = require('path');
const pool = require('../config/database');

router.get('/', (req, res, next) => {
    res.sendFile(path.join(__dirname, '..', 'pages', 'landing.html'));
});



module.exports = router; 