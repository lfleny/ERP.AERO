const express = require('express');
const router = express.Router();
const tokens = require('../config/token');
const models  = require('../models');

router.get('/',
    async (req, res, next) => {
        const token = req.headers['x-token'];
        const refreshToken = req.headers['x-refresh-token'];
        if (token && refreshToken) {
            try {
                const user = tokens.checkBlacklistToken(token, tokens.secret_access);
                req.user = user.user;
            } catch (err) {
                res.status(401).json({message: "Invalid access token"})
            }
            if (typeof req.user != 'undefined') {
                let newTokens = {};
                try {
                    newTokens = await tokens.refreshTokens(token, refreshToken, models, tokens.secret_access, tokens.secret_refresh);
                } catch (err) {
                    res.status(401).json({message: "Invalid refresh token"})
                }
                if (newTokens.token && newTokens.refreshToken) {
                    tokens.revokeToken(token);
                    res.set('Access-Control-Expose-Headers', 'x-token, x-refresh-token');
                    res.set('x-token', '');
                    res.set('x-refresh-token', '');
                    res.json({status: true, message: 'Successful logout'});
                }
            }
        } else {
            res.status(401).json({message: "Authentication error, access and refresh tokens are required"})
        }
    }
);

module.exports = router;