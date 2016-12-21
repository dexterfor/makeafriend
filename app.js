var express = require('express')
    , path = require('path')
    , favicon = require('serve-favicon')
    , logger = require('morgan')
    , cookieParser = require('cookie-parser')
    , bodyParser = require('body-parser')
    , session = require('express-session')
    , MongoStore = require('connect-mongo')(session)
    , flash = require('connect-flash')
    , busboy = require('connect-busboy')
    , Account = require('./models/account');

var mongoose = require('mongoose')
    , passport = require('passport')
    , LocalStrategy = require('passport-local').Strategy;

var routes = require('./routes/index')
    , userRoutes = require('./routes/user_routes')
    , adminRoutes = require('./routes/admin');
      
var app = express();

var dbUri = 'mongodb://localhost/tagboost';

mongoose.connect(dbUri, function(err){
  if(err) console.log("Error while trying to connect to MongoDB");
});

mongoose.connection.on('connected', function () {  
  console.log('Mongoose default connection in app.js open to ' + dbUri);
}); 

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));

app.use(busboy({
  limits: {
    files: 1,
    fileSize: 110000
  }
})); 

app.use(bodyParser.json());
app.use(cookieParser());

app.use(session({
    secret: 'goVeganChooseLife',
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({
		mongooseConnection: mongoose.connection,
		touchAfter: 24 * 3600 // time period in seconds
      })
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

app.use('/', routes);
app.use('/', userRoutes);
app.use('/', adminRoutes);
app.use(express.static(path.join(__dirname, 'public')));

// passport config
passport.use(new LocalStrategy(Account.authenticate()));
passport.serializeUser(Account.serializeUser());
passport.deserializeUser(Account.deserializeUser());

// If the connection throws an error
mongoose.connection.on('error',function (err) {  
  console.log('Mongoose default connection error: ' + err.message);
  console.log("Trying to reconnect");  
  function connect(){
    mongoose.connect(dbUri, function(err){
      if(err) console.log("Error while trying to connect to MongoDB");
    });
  }
  setTimeout(connect, 2000);  
});

mongoose.connection.on('disconnected', function () {  
  console.log('Mongoose default connection disconnected'); 
  console.log("Trying to reconnect");

  function connect(){
    mongoose.connect(dbUri, function(err){
      if(err) console.log("Error while trying to connect to MongoDB");
    });
  }
  setTimeout(connect, 2000);
});

// catch 404 and forward to error handler
/*
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  res.status(400);
  res.render('error.jade', {errMsg: '404: File Not Found'});
  next(err);
});
*/

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    console.log(err.message);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  console.log(err.message);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
