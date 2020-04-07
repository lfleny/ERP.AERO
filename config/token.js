const dotenv = require('dotenv');
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const jwtBlacklist = require('jwt-blacklist')(jwt);

dotenv.config();
jwtBlacklist.config({
    maxBlacklistPerUnit: 100000,
    error: 0.00001,
    unitType: 'h',
    expiresDuration: 1
});

const createTokens = async (user, secret, secret2) => {
    const createToken = jwtBlacklist.sign(
        {
            user: _.pick(user, ['id', 'userEmail']),
        },
        secret,
        {
            expiresIn: '10m',
        },
    );

    const createRefreshToken = jwtBlacklist.sign(
        {
            user: _.pick(user, 'id'),
        },
        secret2,
        {
            expiresIn: '7d',
        },
    );

    return Promise.all([createToken, createRefreshToken]);
};

const refreshTokens = async (token, refreshToken, models, SECRET, SECRET_2) => {
    let userId = -1;
    try {
        const { user: { id } } = jwtBlacklist.decode(refreshToken);
        userId = id;
    } catch (err) {
        return {};
    }

    if (!userId) {
        return {};
    }

    const user = await models.User.findOne({ where: { id: userId }, raw: true });

    if (!user) {
        return {};
    }

    const refreshSecret = SECRET_2 + user.password;

    try {
        jwtBlacklist.verify(refreshToken, refreshSecret);
    } catch (err) {
        return {};
    }

    const [newToken, newRefreshToken] = await createTokens(user, SECRET, refreshSecret);
    return {
        token: newToken,
        refreshToken: newRefreshToken,
        user,
    };
};

const revokeToken = (token) => {
    return jwtBlacklist.blacklist(token);
};

const checkBlacklistToken = (token, secret) => {
    return jwtBlacklist.verify(token, secret);
};


module.exports = {
    secret_access: process.env.SECRET_ACCESS,
    secret_refresh: process.env.SECRET_REFRESH,
    createTokens: createTokens,
    refreshTokens: refreshTokens,
    revokeToken: revokeToken,
    checkBlacklistToken: checkBlacklistToken
};
