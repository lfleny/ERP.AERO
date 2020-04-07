const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const models  = require('../models');
const tokens = require('../config/token');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

router.post('/',
    [
        body('user_id','Invalid user id').custom(async (value) => {
            try {
                let user = await models.User.findOne({
                    where: {'id': value}
                });
                if (!user){
                    return Promise.reject('User not found!');
                }
                return true;
            } catch(err) {
                if (err) throw err;
            }
        }),
        body('user_id','User id is Empty!').trim().not().isEmpty(),
        body('user_pass','The password is Empty').trim().not().isEmpty(),
    ],
    async (req, res, next) => {
        const validation_result = validationResult(req);
        const {user_id, user_pass} = req.body;

        if (validation_result.isEmpty()) {
            try {
                const user = await models.User.findOne({ where: {id: user_id}});
                if (!user) {
                    // user with provided id not found
                    throw new Error('Invalid login');
                }

                const valid = await bcrypt.compare(user_pass, user.password);
                if (!valid) {
                    // bad password
                    throw new Error('Invalid login');
                }

                const [token, refreshToken] = await tokens.createTokens(user, tokens.secret_access, tokens.secret_refresh + user.password);

                if (token && refreshToken) {
                    res.set('Access-Control-Expose-Headers', 'x-token, x-refresh-token');
                    res.set('x-token', token);
                    res.set('x-refresh-token', refreshToken);
                }
                res.status(200).json({ user: _.pick(user, ['id', 'userEmail']) });
            } catch (err) {
                res.status(500).json({ register_error:'User auth error'});
            }
        } else {
            // COLLECT ALL THE VALIDATION ERRORS
            let allErrors = validation_result.errors.map((error) => {
                return error.msg;
            });
            res.status(403).json({ register_error:allErrors,
                old_data:req.body });
        }

    });

router.post('/new_token', auth(), async (req, res, next) => {
    res.status(200).json({ user: _.pick(req.user, ['id']) });
});

module.exports = router;