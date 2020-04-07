const express = require('express');
const router = express.Router();
const models  = require('../models');
const _ = require('lodash');
const fs        = require('fs');
const path = require('path');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

const saveFileDataToDb = async (file_data) => {
    return await models.File.create(file_data);
};

router.post('/upload', auth(), async (req, res, next) => {
    if (!req.files.file) {
        res.status(400).json({
            status: false,
            message: 'No file uploaded'
        });
    } else {
        let file = req.files.file;
        let dir = './uploads/' + req.user.id;

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        try {
            file.mv(dir + '/' + file.name);
        } catch (err) {
            res.status(401).json({status: false, message : "File upload error"});
            return;
        }
        let date = new Date();
        let file_fields = {
            name: file.name,
            type: file.mimetype,
            extension: path.extname(dir + '/' + file.name),
            size: file.size,
            uploadAt: date.toISOString().slice(0, 19).replace('T', ' '),
            userId: req.user.id
        };
        let file_data = {};
        try {
            file_data = await saveFileDataToDb(file_fields);
        } catch (err) {
            fs.unlinkSync(dir + '/' +file.name);
            res.status(401).json({message : "File upload error"});
            return;
        }
        res.json({
            status: true,
            message: 'File is uploaded',
            file_data: _.pick(file_data, ['id', 'name', 'type', 'extension', 'size', 'uploadAt', 'userId'])
        });
    }
});

router.get('/list', [
    auth(),
    body('list_size','list_size must be Integer or Empty!').custom(async (value) => {
        try {
            if (Number.isInteger(parseInt(value)) ? true : typeof value == 'undefined') {
                return true;
            } else {
                return Promise.reject('list_size must be Integer or Empty!');
            }
        } catch(err) {
            if (err) throw err;
        }
    }),
    body('page','page must be Integer or Empty!').custom(async (value) => {
        try {
            if (Number.isInteger(parseInt(value)) ? true : typeof value == 'undefined') {
                return true;
            } else {
                return Promise.reject('page must be Integer or Empty!');
            }
        } catch(err) {
            if (err) throw err;
        }
    }),
    ], async (req, res, next) => {
        const validation_result = validationResult(req);
        if (validation_result.isEmpty()) {
            const list_size = typeof req.body.list_size == 'undefined' ? 10 : req.body.list_size;
            const page = typeof req.body.page == 'undefined' ? 1 : req.body.page;
            let {count, rows } = await models.File.findAndCountAll({
                where: {
                    userId: req.user.id
                },
                offset: parseInt((page-1)*list_size),
                limit: parseInt(list_size),
                raw : true ,
            });
            res.json(rows.map((image) => ({
                ..._.pick(image, ['id', 'name', 'type', 'extension', 'size', 'uploadAt'])
            })));
        } else {
            let allErrors = validation_result.errors.map((error) => {
                return error.msg;
            });
            res.status(403).json({status: false, message: allErrors});
        }
});

router.delete('/delete/:id', auth(), async (req, res, next) => {
    const file_id = req.params.id;

    let file = await models.File.findOne({
        where: {'id': file_id}
    });

    if (!file){
        res.status(401).json({status: false, message : "File not found"});
        return;
    }
    const file_exist = fs.existsSync(`./uploads/${req.user.id}/${file.name}`);
    if (!file_exist) {
        res.status(401).json({status: false, message : "File not found"});
        return;
    }
    try {
        fs.unlinkSync(`./uploads/${req.user.id}/${file.name}`);
    } catch (err) {
        res.status(500).json({status: false, message : "Error during file deleting"});
        return;
    }
    try {
        await file.destroy();
    } catch (err) {
        res.status(500).json({status: false, message : "Error during file deleting"});
        return;
    }

    res.status(200).json({
        status: true,
        message: 'File is deleted',
        file_data: _.pick(file, ['id', 'name', 'type', 'extension', 'size', 'uploadAt', 'userId'])
    });
});

router.get('/:id', auth(), async (req, res, next) => {
    const file_id = req.params.id;
    let file = await models.File.findOne({
        where : {'id': file_id, 'userId' : req.user.id},
        raw : true
    });

    if (!file){
        res.status(401).json({status: false, message : "File not found"});
        return;
    }

    res.status(200).json(_.pick(file, ['id', 'name', 'type', 'extension', 'size', 'uploadAt']));
});

router.get('/download/:id', auth(), async (req, res, next) => {
    const file_id = req.params.id;

    let file = await models.File.findOne({
        where : {'id': file_id},
        raw : true
    });

    if (!file){
        res.status(401).json({status: false, message : "File not found"});
        return;
    }

    let file_data = fs.readFileSync(`./uploads/${req.user.id}/${file.name}`, 'binary');

    res.setHeader('Content-Length', file.size);
    res.setHeader('Content-Type', file.type);
    res.setHeader('Content-Disposition', 'attachment; filename=' + file.name);
    res.write(file_data, 'binary');
    res.status(200);
    res.end();
});

router.put('/update/:id', auth(), async (req, res, next) => {
    if (!req.files || typeof req.files.file == 'undefined') {
        res.status(400).json({
            status: false,
            message: 'Request must contain a new file!'
        });
    } else {
        const file_id = req.params.id;

        let file = await models.File.findOne({
            where : {'id': file_id},
            raw : true
        });

        if (!file) {
            res.status(401).json({status: false, message : "File not found"});
            return;
        }

        let dir = './uploads/' + req.user.id;

        const file_exist = fs.existsSync(`./uploads/${req.user.id}/${file.name}`);

        let old_file_path = "";
        if (!file_exist) {
            res.status(401).json({status: false, message : "File not found"});
            return;
        } else {
            const root = path.dirname(`./uploads/${req.user.id}/${file.name}`)
            old_file_path = path.join(root,`old_${file.name}`);
            fs.renameSync(`./uploads/${req.user.id}/${file.name}`, old_file_path)
        }

        let new_file = req.files.file;

        try {
            new_file.mv(dir + '/' + new_file.name);
        } catch (err) {
            res.status(401).json({status: false, message : "File upload error"});
            return;
        }

        let date = new Date();

        let file_data = {
            name : req.files.file.name,
            type : req.files.file.mimetype,
            extension : path.extname(dir + '/' + req.files.file.name),
            size : req.files.file.size,
            uploadAt : date.toISOString().slice(0, 19).replace('T', ' '),
            userId : req.user.id,
        };

        try {
            await models.File.update(
                file_data,
                {
                    where: {
                        id: file.id
                    }
                });
        } catch (err) {
            res.status(401).json({status: false, message : "File updating error"});
            return;
        }

        file_data.id = file.id;

        try {
            fs.unlinkSync(old_file_path);
        } catch (err) {
            //save to log
        }

        res.json({
            status: true,
            message: 'File is updated',
            file_data: _.pick(file_data, ['id', 'name', 'type', 'extension', 'size', 'uploadAt', 'userId'])
        });

    }
});

module.exports = router;