var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    passportLocalMongoose = require('passport-local-mongoose');

var user = new Schema({  username: String, 
                         password: String,
                         email: String,
                         verify_code: String,
                         tags: Array,
                         verified: false,
                         profile: {},
                         location: {},
                         img_ext: String
                      });

user.plugin(passportLocalMongoose);

module.exports = mongoose.model('Account', user);
