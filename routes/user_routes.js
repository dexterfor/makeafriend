var express = require('express')
    , passport = require('passport')
    , user = require('../models/account')
    , router = express.Router()
    , mongoose = require('mongoose')
    , bodyParser = require('body-parser')
    , mime = require('mime')
    , util = require('util')
    , busboy = require('connect-busboy')
    , fs = require('fs')
    , nodemailer = require('nodemailer')
    , parserFalse = bodyParser.urlencoded({ extended: false })
    , parserTrue = bodyParser.urlencoded({ extended: true })
    , html_email = require('../custom_modules/html-email')
    , cmsg = require('../custom_modules/custom-messages');

var transporter = nodemailer.createTransport("SMTP", {
    host: "email-smtp.us-west-2.amazonaws.com", 
    secureConnection: true,
    port: 465, 
    auth: {
        user: "zzz", 
        pass: "zzz"
    }
});

// These will be moved to custom messages
var errRetrieve = "Error retrieving data. Please try again.";
var noLogin = "You are not logged in.";

/*
 * Sends email from one user to another.
 * Gets by POST sender's and receiver's usernames from email_form.jade
 * Retrieves both users' emails.
 * A user must have their email verified in order to send emails
 */
router.post('/send_email', parserFalse, (req, res) => {
  if(req.user){
    //console.log('receiver username: ' + req.body.receiver);
    //console.log('sender username: ' + req.body.sender);
    //console.log('message body: ' + req.body.message_body);
    
    if(req.body.sender == req.user.username){
      var sender_username = req.body.sender;
      var receiver_username = req.body.receiver;
      var receiverQry = { username: receiver_username };
      var senderQry = { username: sender_username };
      var message_body = req.body.message_body;
      var options = "";

      // Retrieve sender's email
      user.findOne(senderQry, (err, sender) => {
        if(err) {
          options = {
            receiver_username: receiver_username,
            sender_username: sender_username,
            err: true, 
            errMsg: "Error occurred."
          };
          return res.render('user/send_email', options); 
        } else {
          if(!sender.verified){
            console.log("email not verified");
 
            options = { 
              sender_username: sender_username,
              receiver_username: receiver_username,
              notVerified: true, 
              notVerifiedMsg: cmsg.verifEmail()
            };
            return res.render('user/send_email', options);
          }
          
          if(message_body.length > 1020) {
            options = { 
              sender_username: sender_username,
              receiver_username: receiver_username,
              msg: "Message maximum length exceeded."
            };
            return res.render('user/send_email', options);
          }
          // Retrieve receiver's email
          user.findOne(receiverQry, (err, receiver) => {
            if(err) { 
              options = {
                sender_username: sender_username,
                receiver_username: receiver_username,
                err: true, 
                errMsg: "Error occurred."
              };
              return res.render('user/send_email', options); 
            } else {
              var mailOptions = {
                from: sender.email, // sender address
                to: receiver.email, // list of recipients
                subject: 'Sent from Tagboost', // Subject line
                html: html_email.userEmail(sender.username, message_body)
              };
              transporter.sendMail(mailOptions, (err, info) => {
                if(err){
                  console.error('Error sending email');
                  options = {
                    user: req.user.username,
                    err: true, 
                    errMsg: "Error occurred while sending email."
                  };
                  return res.render('user/error_user', options);
                }

                if(info.message.slice(0, 3) == "250"){
                  console.log('email sent successfully');
                  console.log('req user username: ' + req.user.username);
                  options = {
                    user: req.user.username,
                    msg: "Email has been successfully sent!" 
                  };
                  res.render('user/error_user', options);
                } else {
                  options = {
                    user: req.user.username,
                    err: true, 
                    errMsg: "Error occurred. Please try again or contact support." 
                  };
                  res.render('user/error_user', options);
                }
              });

             transporter.close();
            }
          });
        }
      });
    } else {
      options = {
        user: req.user.username,
        msg: "Sender username must match the logged in user!"
      };
      res.render('user/error_user', options); }
    // end of if(req.user)
  } else { res.render('login'); }
});

/*
 * Renders send_email.jade with email form
 */
router.get('/email_form/:receiverusername', (req, res) =>{
  if(req.user){
    var options = { 
      sender_username: req.user.username, 
      receiver_username: req.params.receiverusername 
    };
    res.render('user/send_email', options);
  } else { res.redirect('/login'); }
});

/*
 * Renders verification.jade that allows to request a 
 * new email verification code
 */
router.get('/new_verification', (req, res) => {
  res.render('verification');
});

/*
 * POST receives a new request for email verification from
 * verification.jade and sends out a new email verification code
 */
router.post('/request_verification', parserTrue, (req, res) =>{
    var email = req.body.email;
    console.log('email: ' + email);

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
    var query = { email: email };
    var update = { $set: { verified: false, verify_code: random_string } };
    console.log("random string: "+random_string);
    user.findOneAndUpdate(query, update, function(err, userDoc){
      if(err) { 
        console.log(err.message);
      } else { 
        // setup e-mail data with unicode symbols
        var verifyLink = "http://www.makeafriend.club/verifyemail/" + random_string;
        var mailOptions = {
            from: '"Make a Friend Club" <dexteriot@gmail.com>', // sender address
            to: email, // list of recipients
            subject: 'Hello', // Subject line
            text: 'Hello world ?',
            html: html_email.verifyEmail(verifyLink)
        };
        
        var options;
        // send mail with defined transport object
        transporter.sendMail(mailOptions, (err, info) => {
          if(err){
            console.log(err);
          }
          
          if(info.message.slice(0, 3) == "250"){
            console.log('email sent successfully');
            options = { msg: "Email with a verification code has been sent." };
            res.render('verification', options);
          } else {
            options = { 
              err: true, 
              errMsg: "Error occurred. Please try again or contact support." 
            };
          }
        });
        
        transporter.close();
      }
    });
});

/*
 * Verifies user's email upon registration or when a new email
 * verification code has been requested.
 */
router.get('/verifyemail/:verifycode', (req, res) => {
  var query = { verify_code: req.params.verifycode };
  var update = { $set: { verified: true } };
  user.findOneAndUpdate(query, update, (err, doc) => {
    var options = { 
      err: true, 
      errMsg: cmsg.verifFail() 
    };
    
    if(err || doc == null) { 
      res.render('login', options); 
    } else { res.render('login', { msg: cmsg.verifSuccess() }); } 
  });  
});

/*
 * Renders users Home Page that displays a list of matching users based on tags
 * The default display is Anywhere i.e. matching users anywhere in the world
 * Other options are In My Country, In My State, In My City
 */
router.get('/home/:username/:page/:place', function (req, res) {
  if(req.user){
    user.findOne({username: req.user.username}, function(err, thisUser){
      if(!thisUser || err){
        res.render('user/home', { err:true, errMsg: errRetrieve });
      } else if (!thisUser.location || !thisUser.profile){
        res.redirect('/profile');
      } else if(!thisUser.tags[0]) {
        res.redirect('/tags');
      } else {
          var select = '-_id username tags location profile img_ext';
          var place = req.params.place;
          var usrQry;

          if (place == "city") { 
            usrQry = user.find({}).where("location.locality").equals(thisUser.location.locality);
          }
          
          if (place == "state") { 
            usrQry = user.find({}).where("location.administrative_area_level_1").equals(thisUser.location.administrative_area_level_1);
          }
          
          if (place == "country") { 
            usrQry = user.find({}).where("location.country").equals(thisUser.location.country);
          }
          
          if (place == "anywhere") { 
            usrQry = user.find({});
          }
                    
          usrQry.select(select).exec(function(err, allUsers){
            if(err) { return res.render('user/error_user'); }
              // max number of tags 20 (changed from 15 to 20)
              var arrUsers = [];
              var tmpUsers = [];
              var arrRankings = []; var arrRankings2 = [];
              var i, k;
              var matches = 0;

              /*
               * Iterate through allUsers and see whose tags match the current user
               * once there is a match increase matches++
               * once it finished iterating 20 times (number of max tags) then
               * push users into a temp array and matches into two new arrays
               */
              for(i = 0; i < allUsers.length; i++){
                for(k = 0; k < 20; k++){
                  if (thisUser.tags[k] && allUsers[i].username != thisUser.username){
                    if (allUsers[i].tags.indexOf(thisUser.tags[k]) >= 0){
                      matches ++;
                    }
                  }
                }
                
                if (k == 20 && matches){
                  allUsers[i].tmpRank = matches;
                  tmpUsers.push(allUsers[i]);
                  arrRankings.push(matches);
                  arrRankings2.push(matches);
                  matches = 0;
                }
              }

            // Sorting both ranking arrays in descending order
            arrRankings.sort(function(a, b){ return b-a; });
            arrRankings2.sort(function(a, b){ return b-a; });

            for(var d=0; d<arrRankings2.length; d++){
              for(var t=0; t<arrRankings2.length;t++){

              /*
               * If tmpUsers tmpRank matches arrRankings
               * set tmpRank to a random number so it doesnt get matched again
               * set real rank to corresponding arrRankings
               * push the user into a new array to preserve the order
               * splice arrRankings to remove the matching rank
               */
                if(tmpUsers[t].tmpRank == arrRankings[0]){
                  tmpUsers[t].tmpRank = d - 150;
                  tmpUsers[t].rank = arrRankings[0];
                  arrUsers.push(tmpUsers[t]);
                  arrRankings.splice(0, 1);

                }
              }
            }
          
          var follPage;
          var prevPage;
          
          // matching users per page
          var matchingUsers; 
          var rankings;
          
          // length of all matching users
          var lengthTotal = arrUsers.length;
          
          // Doing some pagination calculations
          var currPage = req.params.page;
          var itemsPerPage = 5;

          // Startindex is starting index from which we will splice
          var startIndex = (parseInt(currPage) - 1)*itemsPerPage;
          
          //console.log('startindex: ' + startIndex);
          prevPage = startIndex == 0 ? 0 : parseInt(currPage) - 1;
          
          if(arrUsers.length <= itemsPerPage) { 
            follPage = 0; 
          } else if (startIndex + itemsPerPage == arrUsers.length) {
            follPage = 0;
          } else {
            follPage = parseInt(currPage) + 1;
          }
          
          //console.log(" arrusers.length: " + arrUsers.length);  
          matchingUsers = arrUsers.splice(startIndex, itemsPerPage);
          rankings = arrRankings2.splice(startIndex, itemsPerPage);
          //console.log('matching users length: ' + matchingUsers.length);
          
          if(matchingUsers.length < itemsPerPage) follPage = 0;
          //console.log('prevpage: ' + prevPage + " follpage: " + follPage);
          //console.log('items per page: ' + itemsPerPage);
          
          res.render('user/home', {
                      user: req.user,
                      matchingUsers: matchingUsers,
                      ranking: rankings,
                      follPage: follPage,
                      prevPage: prevPage,
                      place: req.params.place,
                      tagsLength: thisUser.tags.length,
                      startIndex: startIndex,
                      lengthTotal: lengthTotal,
                      itemsPerPage: itemsPerPage
                    });
          });
      } //user.findOne else ends here
    });  
  } else {res.render('login', { err: true, errMsg: noLogin }); }
});

// Render Tags page in settings
router.get('/tags', (req, res)=>{
    if(req.user) {
      var query = { username: req.user.username };
      
      // fod = findOneDoc
      user.findOne( query, (err, fod)=>{
        if(err) {
          var options = { 
              user: req.user, 
              userTags: 0, 
              err: true, 
              errMsg: errRetrieve 
          };
          res.render('user/tags', options);
        } else if(!fod.tags[0]){
          var options_2 = { 
              user: req.user,
              userTags: 0, 
              err: true, 
              errMsg: cmsg.mustSetTags()
          };                  
          res.render('user/tags', options_2);
        } else {
          res.render('user/tags', { user: req.user, userTags: fod.tags });
        }
      });
    } else res.render('index', { err: true, errMsg: noLogin });
});

// Render User Settings Page
router.get('/settings', function (req, res) {
    if(req.user) {
      var query = { username: req.user.username };
      var select = '-_id tags location img_ext';
      console.log('inside settings');
      
      // fod = findONeDoc
      user.findOne(query).select(select).exec(function(err, fod){
        if(err || fod == null){
          console.log("error with db");
          var options = {
              err: true, 
              errMsg: 'Error retrieving user', 
              user: req.user
          };
          //mongoose.disconnect();
          res.render('user/settings', options);
        } else {
          var options2 = {
              user: req.user,
              img_ext: fod.img_ext
          };  
          res.render('user/settings', options2); 
          //mongoose.connection.close();
        }
      });
    } else {
        res.render('index', { err: true, errMsg: "You are not logged in!" }); 
    }
}); //end get user settings

// Render User Profile Page
router.get('/profile', function (req, res) {
  if(req.user) {
    var query_user = { username: req.user.username };
      user.findOne(query_user, function(err, user){
        if(err) {
          console.log("Error retrieving profile");
          res.render('user/error_user', { user : false });
        } else if(!user.profile || !user.location){
          var options_1 = { 
              user : req.user, 
              user_location: false,
              err: true,
              errMsg: cmsg.setYearTags()
          };
          res.render('user/profile', options_1);
        } else {
            var city, state, country, user_location;
            
            if(Object.getOwnPropertyNames(user.location).length == 0){
              user_location = "";              
            } else {
              city = user.location.locality;
              state = user.location.administrative_area_level_1;
              country = user.location.country;
              user_location = city + ", " + state + ", " + country;              
            }
            
            //var userLocation = locationDb.location;
            var options = {
                user_location : user_location, 
                user: req.user
            };
            res.render('user/profile', options);
        }
      });
  } else { res.render('index', { msg: "You're not logged in!" }); }
}); // end of username/profile

/*
 *  Render User's public profile page
 */
router.get('/:username/public', function (req, res) {
  var query_user = {username: req.params.username};
  var user_location;
  if(req.user) {
      user.findOne(query_user, function(err, user){
        if(err || !user) {
          console.log("Error retrieving profile");
          res.render('user/error_user', { user : req.user });
        } else {
          if(Object.getOwnPropertyNames(user.location).length == 0){
            user_location = "";              
          } else {
            city = user.location.locality;
            state = user.location.administrative_area_level_1;
            country = user.location.country;
            user_location = city + ", " + state + ", " + country;              
          }
           
            var options = {
                user_location : user_location, 
                user_public: user,
                user: req.user
            };
            //console.log("otherUser: " + user);
            res.render('user/public', options);
        }
      });
  } else { res.render('user/public', { err: true, errMsg: "You're not logged in!" }); }
}); // end of username/public

/*
 * Save Profile server side
 * Parse the incoming Profile object containing
 * profile items, sanitize it and save to DB
 */
router.post('/user/saveprofile', parserTrue, (req, res) => {
  // If user is logged in
  if(req.user) {
    var profileObj = req.body.profile;
    var regex = new RegExp("^[a-zA-Z0-9 ]+$");
    var regexAboutMe = new RegExp("^[a-zA-Z0-9 !.,?()':;-]+$");    
    var illegalChar = false;
    var query = { username: req.user.username };
    
    /* for testing only
    for(var prop in profileObj){
      console.log(profileObj[prop]);
    }
    */
   
    // Testing regex in profile items
    for(var prop in profileObj){
      if(profileObj.hasOwnProperty(prop)){
        if(!regex.test(prop.trim())){
          illegalChar = true;
        }
      }
    }
    
    // Testing regex in about me, it allows punctuation marks
    // unlike other fields
    if (!regexAboutMe.test(profileObj["aboutMe"])){
      illegalChar = true; 
    }
    
    var update = { $set: { profile: profileObj } };
    // If illegal chars found set error true
    // otherwise run an update DB query to save profile
    if(illegalChar){
      res.send( {err: true, errMsg: cmsg.alphaNumPunct() });
    } else {
        user.findOneAndUpdate(query, update, function(err, returnDoc){
          if(err || returnDoc === null){
            console.log(err);
            res.send({
                success: false,
                err: true,
                errMsg: cmsg.profileErr()
            });
          } else { 
            res.send({ success: true, msg: "Profile saved successfully" }); 
          } // end of IF err   
        }); // end of findOneAndUpdate
    } // end of IF illegalChar
  // below is end of IF req.user
  } else res.render('index', { success: false, msg: "You are not logged in" });
      
}); // end Save Profile

// SAVE TAGS
router.post('/user/save_tags', parserFalse, function (req, res) {
  if(req.user) {
    // Parsing tags that were sent in userFront.js
    var userTags = req.body["tags[]"];
    
    /* For testing purposes only
    if (userTags instanceof Array) { console.log("its an array"); }
    else { console.log("its not an array"); }
    */
   
    var query = { username: req.user.username };
    var options = { upsert: true };
    var regex = new RegExp("^[a-zA-Z0-9 ]+$");
    var illegalChar = false;
    var illegalCharsMsg = "Only alphanumeric characters and spaces allowed"; 
    var tooManyChars = false;
    var tooManyCharsMsg = "Not more than 30 characters allowed per entry"; 
    var processedTags = [];
      
    // Checking if element not empty, sanitizing,
    // capitalizing first char and lowercase the rest
    // If all fine then push into new array
    if(typeof userTags == "string"){
      if(regex.test(userTags)){
        var newElem = userTags.charAt(0).toUpperCase() + userTags.slice(1).toLowerCase();
        processedTags.push(newElem);
      } else {
          illegalChar = true; 
      }
      
      if(userTags.length > 30) { tooManyChars = true; }
      
    } else {
      userTags.forEach(function(element, index){
        element.trim();
        if(element){
          if(regex.test(element)){
            var newElem = element.charAt(0).toUpperCase() + element.slice(1).toLowerCase();
            processedTags.push(newElem);
          } else {
              illegalChar = true; 
          }
        }
      });

      userTags.forEach(function(element, index){
        element.trim();
        if(element){
          if(element.length > 30) { tooManyChars = true; }
        }
      });
    }
    var update = { $set: { tags: processedTags } };
    // if illegal chars are found send warning msg
    // else send an update query to MongoDB
    if(illegalChar) {
      res.send({ success: false, msg: illegalCharsMsg });
    } else if(tooManyChars){ res.send({ success: false, msg: tooManyCharsMsg });
    } else {
        user.findOneAndUpdate(
          query, update, options, function(err, returnDoc){
          if(err){ console.log(err);
            res.send( {success: false, msg: "Error saving tags"} );
          } else { 
              res.send({ success: true, msg: "New tags saved" }); 
          }
        }); 
    }
    // end of 'if req.user' i.e. if user not logged in  
    } else res.render(
      'index', 
      { 
        success: false, 
        msg: "You are not logged in!"
      }
    );
}); // end of router.post savegeneraltags

/* 
 * Upload profile image from within settings.jade
 * busbuy module is used for uploading.
 * Max size is set at 110KB (displayed to user as max 100KB) in app.js
 * If it hits max size write stream stops and an error issued,
 * otherwise the image is written to public/usrimages
 * and the extension is stored in db.
 * 
 */
router.post('/upload_img', function(req, res, next){
  if(req.user){
    var fstream;
    var imageArr = ['image/png', 'image/jpeg'];
    req.pipe(req.busboy);

    req.busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
      var img_ext = filename.substr(filename.indexOf('.') + 1);
      var path = __dirname + "/../public/usrimages/" + req.user.username + "." + img_ext;
      var query = { username: req.user.username };
      var update_1 = { $set: {img_ext: img_ext} };
      var update_2 = { $set: { img_ext: "" }};

      // Checking if it's an image
      if(imageArr.indexOf(mimetype) == -1) {
        res.status(415).send("Not an image!");
      } else {
        //Storing the img extension in db
        user.findOneAndUpdate(query, update_1, function(err, doc){
          if(err || doc == null) {
            res.status(453);
          } else {
            var limit_reach = false;
            var limit_reach_err = "Image is too large! Partially uploaded image deleted";
            
            // Creating a writestream using fs module
            fstream = fs.createWriteStream(path);
            file.pipe(fstream);
            
            // If the image is larger than 110KB, limit_reach is set to true
            // just before res.status because res.status will trigger on.finish
            // so limit_reach will be seen as true within on.finish
            // the partially uploaded file is deleted
            file.on('limit', function(){
              fs.unlink(path, function(){
                limit_reach = true;
                // Unset img_ext
                user.findOneAndUpdate(query, update_2, function(err, doc){
                  // Not checking for err for now as
/*ATT*/           // it will set headers twice, maybe later
                });
                res.status(455).send(limit_reach_err);
              });
            });

            req.busboy.on('finish', function() {
              // Issue save image success if image is less than max size
              if(!limit_reach){
                res.send("Image saved successfully!");
              }
            });
          }
        });      
      }
    });
  } else { res.send("You are not logged in!"); } // end of if(req.user)
});

/*
 *  Remove Image function from within settings.jade
 */
router.post('/remove_img', function(req, res, next){
  if(req.user){
    var query = { username: req.user.username };
    var username = req.user.username;
    // Find the user and the image extension
    user.findOne(query, function(err, user_find){
      if(err) {
        res.status(454).send("Error occurred. Please try again."); 
      } else {
        if(user_find.img_ext){
          var ext = user_find.img_ext;
          var path = __dirname + "/../public/usrimages/" + username + "." + ext;
          
          // Check if the image exists
          fs.access(path, (err)=>{
            if(!err){
              // If it exists unset img_ext and delete the file
              var update = { $set: { img_ext: "" }};
              user.findOneAndUpdate(query, update, function(err, user_update){
              });
              fs.unlink(path,()=>{
                res.status(200).send("Image deleted.");
              });
            } else { console.error('nothing to delete'); res.send("Nothing to delete!"); }
          });
        } else { res.send("Nothing to delete!"); }
      } 
    });
  } else { res.send("You are not logged in!"); }
});

/*
 * Save Location function, a Google Places API autocomplete object
 * is passed in via an AJAX call, Front End - settings.js:#saveloc
 */
router.post('/saveloc', parserTrue, function(req, res, next){
  if(req.user) {
    /*
     * userLoc is the incoming Google Places autocomplete object
     * it supposed to have only 3 following properties:
     * 1. locality : city
     * 2. administrative_area_level_1 : state/prov
     * 3. country
     */
    var userLoc = req.body.userLocation;
    var userLocDb = {};
    
    // Testing for illegal characters i.e. sanitizing input
    var rgx = new RegExp(/[$<>(){}]+/);
    var rgxLty = rgx.test(userLoc.locality);
    var rgxState = rgx.test(userLoc.administrative_area_level_1);
    var rgxCtry = rgx.test(userLoc.country);

    var typeString = false; 
    var maxLength = false;
    var userLocArr = ["locality", "administrative_area_level_1", "country"];
    
    // Checking if the values are strings and are not too long
    // 105 is the longest location name in the world, in New Zealand
    for (var i=0; i<userLocArr.length; i++) {
      if (typeof userLoc[userLocArr[i]] !== 'string') {
        typeString = true; 
      }
      if (userLoc[userLocArr[i]].length > 105) {
        maxLength = true;
      }
    }
    
    // If locality, state or city contain illegal chars
    // or if the value is not a string or if its too long
    if (rgxLty || rgxState || rgxCtry || typeString || maxLength) {
      res.status(400).send('Location is not valid!');
    } else {
        // Inserting items into a new obj to prevent user from
        // sending altered objects i.e. with extra properties etc
        userLocDb.locality = userLoc.locality;
        userLocDb.administrative_area_level_1 = userLoc.administrative_area_level_1;
        userLocDb.country = userLoc.country;
        
        var update = { $set: { location: userLocDb } };
        var query = { username: req.user.username };
        var options = { upsert: true };        

        user.findOneAndUpdate(query, update, options, function(err, returnedDoc){
          if(err || returnedDoc == null) {
            res.send('Error occurred. Please try again or go to help section.');
          } else {
            res.send('Location saved');
          }
        });
    }
  } else {
    res.render('login', { msg: "You're not logged in!" });
  }
  
});

module.exports = router;
