const express = require('express');
const router = express.Router();
const models  = require('../models');
const tokens = require('../config/token');
const auth = require('../middleware/auth');

router.get('/', auth(),
    async (req, res, next) => {
        res.send(req.user.id);
    }
);

module.exports = router;