const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const fileUpload = require('express-fileupload');
const cors = require('cors');

require('custom-env').env('production');

const signUpRouter = require('./routes/signup');
const signInRouter = require('./routes/signin');
const fileRouter = require('./routes/file');
const infoRouter = require('./routes/info');
const logoutRouter = require('./routes/logout');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// enable files upload
app.use(fileUpload({
  createParentPath: true
}));

app.use('/signup', signUpRouter);
app.use('/signin', signInRouter);
app.use('/file', fileRouter);
app.use('/info', infoRouter);
app.use('/logout', logoutRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  res.status(404).json({status: false, message: 'Invalid request'})
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
