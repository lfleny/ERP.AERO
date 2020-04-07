const models  = require('../models');
const tokens = require('../config/token');


module.exports = () => {
    return async (req, res, next) => {
        const token = req.headers['x-token'];
        const refreshToken = req.headers['x-refresh-token'];
        if (token && refreshToken) {
            try {
                const user = tokens.checkBlacklistToken(token, tokens.secret_access);
                req.user = user.user;
            } catch (err) {
                res.status(401).json({status: false, message: "Invalid access token"})
                return;
            }
            if (typeof req.user != 'undefined') {
                let newTokens = {};
                try {
                    newTokens = await tokens.refreshTokens(token, refreshToken, models, tokens.secret_access, tokens.secret_refresh);
                } catch (err) {
                    res.status(401).json({status: false, message: "Invalid refresh token"});
                    return;
                }
                if (newTokens.token && newTokens.refreshToken) {
                    res.set('Access-Control-Expose-Headers', 'x-token, x-refresh-token');
                    res.set('x-token', newTokens.token);
                    res.set('x-refresh-token', newTokens.refreshToken);
                    next();
                }
            }
        } else {
            res.status(401).json({status: false, message: "Authentication error, access and refresh tokens are required"})
        }
    }
};

