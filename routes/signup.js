const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const models  = require('../models');
const tokens = require('../config/token');
const _ = require('lodash');
const { body, validationResult } = require('express-validator');

const createUser = async (user_id, password) => {
    return await models.User.create({ id : user_id, password : password });
};

router.post('/',
    [
        body('id','Invalid user id!').not().isEmpty().custom(async (value) => {
            try {
                let user = await models.User.findOne({
                    where: {'id': value}
                });
                if (user){
                    return Promise.reject('This id already in use!');
                }
                return true;
            } catch(err) {
                if (err) throw err;
            }
        }),
        body('password','The password must be of minimum length 6 characters').trim().isLength({ min: 6 }),
    ],
    async (req, res, next) => {
        const validation_result = validationResult(req);
        const {id, password} = req.body;
        // IF validation_result HAS NO ERROR
        if (validation_result.isEmpty()) {
            try {
                const user_pass_hash = await bcrypt.hash(password, 12);
                const user = await createUser(id, user_pass_hash);
                const [token, refreshToken] = await tokens.createTokens(user, tokens.secret_access, tokens.secret_refresh + user.password);
                if (token && refreshToken) {
                    res.set('Access-Control-Expose-Headers', 'x-token, x-refresh-token');
                    res.set('x-token', token);
                    res.set('x-refresh-token', refreshToken);
                }
                res.status(200).json({ user: _.pick(user, ['id']) });
            } catch (err) {
                res.status(500).json({ register_error:'User registration error'});
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

module.exports = router;