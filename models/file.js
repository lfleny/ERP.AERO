module.exports = (sequelize, DataTypes) => {
    return sequelize.define('File', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING,
        },
        type: {
            type: DataTypes.STRING,
        },
        extension: {
            type: DataTypes.STRING,
        },
        userId: {
            type: DataTypes.STRING,
        },
        size: {
            type: DataTypes.INTEGER,
        },
        uploadAt: {
            type: DataTypes.DATE,
        },
    });
};