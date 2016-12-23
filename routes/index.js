var express = require('express'),
    passport = require('passport'),
    user = require('../models/account'),
    router = express.Router(),
    bodyParser = require('body-parser'),
    nodemailer = require('nodemailer'),
    parserFalse = bodyParser.urlencoded({ extended: false }),
    parserTrue = bodyParser.urlencoded({ extended: true }),
    html_email = require("../custom_modules/html-email"),
    mongoose = require('mongoose'),
    cmsg = require("../custom_modules/custom-messages");

/*
 * If the user is logged in send them to the home page
 * otherwise display the index page
 */
router.get('/', (req, res) => {
  if(req.user) res.redirect('/home/' + req.user.username + '/1/anywhere');
  else res.render('index');
});

/*
 * If the user is logged in send them to the home page
 * otherwise display the index page
 */
router.get('/index', (req, res, next) => {
  if(req.user) res.redirect('/home/' + req.user.username + '/1/anywhere');
  else res.render('index');
});

/*
 * Display the registration page
 */
router.get('/register', (req, res) => {
    res.render('register');
});

/*
 * Display the login page
 */
router.get('/login', (req, res) => {
    res.render('login');
});

/*
 * POST register. Receives username, password and email from register.jade
 * Creates an entry in the db. Sets an email verification code.
 * Whether email has been verified is not checked at this stage, it's only
 * checked if the user wants to send an email to another user
 */
router.post('/register', parserFalse, (req, res) => {
  var reqUsername = req.body.username;
  var reqPassword = req.body.password;
  console.log('requsrname: ' + reqUsername);
  console.log('reqpassword: ' + reqPassword);
  
  var options = {};
  var userRegex = new RegExp("^[a-zA-Z0-9]+$");
  
  if(!userRegex.test(reqUsername)){ 
    options = { err: true, errMsg: cmsg.usrAlphNum() };
    return res.render('register', options);
  }
  
  if(reqUsername.length < 5 || reqUsername.length > 170){
    options = { err: true, errMsg: cmsg.usr5And170() };
    return res.render('register', options);
  }
  
  if(reqPassword.length < 8){
    options = { err: true, errMsg: cmsg.pass8Chars() };
    return res.render('register', options);
  }
  
  user.register(new user({ username : reqUsername }), reqPassword, (err, account) => {
    if (err) {
      console.log("Error registering for: " + reqUsername + " errMsg: " + err.message);
      return res.render('register', { err: true, errMsg : err.message });
    }
    
    var email = req.body.email;
    console.log('email: ' + email);
    var username = account.username;
    var transporter = nodemailer.createTransport("SMTP", {
        host: "email-smtp.us-west-2.amazonaws.com", 
        secureConnection: true,
        port: 465, 
        auth: {
            user: "zzz", 
            pass: "zzz"
        }
    });

    function randomString(length, chars) {
      var result = '';
      console.log('chars: '+chars);
      for (var i = length; i > 0; --i){
        result += chars[Math.round(Math.random() * (chars.length - 1))];
      }
      return result;
    }

    var random_string = randomString(32,
    '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
    var query = { username: username };
    var update = { $set: { email: email, verify_code: random_string } };
    
    user.findOneAndUpdate(query, update, (err, userDoc) => {
      if(err) {
        console.log(err.message);
      } else { 
        // setup e-mail data with unicode symbols
        var verifyLink = "http://www.makeafriend.club/verifyemail/" + random_string;
        var mailOptions = {
            from: '"Make a Friend Club" <makeafriend@gmail.com>', // sender address
            to: email, // list of recipients
            subject: 'Please verify your email at MakeaFriend.Club', // Subject line
            html: html_email.verifyEmail(verifyLink)
        };
        
        // send mail with defined transport object
        transporter.sendMail(mailOptions, (err, info) => {
          if(err){
            console.log("Error sending email");
            console.log(err.message);
            options = { 
              err: true, 
              errMsg: "Error occurred. Please check your email address." 
            };
            return res.render('register', options);
          }
          
          if(info.message.slice(0, 3) == "250"){
            console.log('email sent successfully');
            // Users are authenticated based on succefully registered 
            // username, password and valid email. Email verification 
            // is only checked if the user wants to send email to another user
            passport.authenticate('local')(req, res, () => {
              res.redirect('/profile');
            });
          }
        });
        
        transporter.close();
      }
    });
  });  
});

/* Example of alternate authentication
router.post('/login',
  passport.authenticate('local', { successRedirect: '/profile',
                                   failureRedirect: '/login',
                                   failureFlash: true })
);
*/

/*
 * Login. Verification. 
 */
router.post('/login', parserFalse, (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    var options = "";
    if (err) { 
      console.log('err:');
      console.log(err.message);
      return next(err);
    }
    
    if (!user) { 
      options = { err: true, errMsg: cmsg.loginErr() };
      return res.render('login', options); 
    }
    
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      return res.redirect('home/' + user.username + "/1/anywhere");
    });
  })(req, res, next);
});

/*
 * Logout
 */
router.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

/*
 * Restricting access to view profile images to 
 * logged in users only
 */
router.get('/usrimages/:usernameImage', (req, res, next) => {
  var options = { err: true, errMsg: "You are not logged in!" };
  req.user ? next() : res.render('error_user', options);
});

module.exports = router;
