/**
 * Created by Ming on 4/4/2015 0004.
 */
// config/passport.js

// load all the things we need
var LocalStrategy   = require('passport-local').Strategy;
//TODO need to be fixed.

// expose this function to our app using module.exports
module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.USERID);
    });

    // used to deserialize the user
    passport.deserializeUser(function(req,id,done) {

        req.getConnection(function(error,connection){
            connection.query("select * from USER where USERID = "+id,function(err,rows){
                done(err, rows[0]);
            });
        });
    });


    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-login', new LocalStrategy(
        {
            passReqToCallback : true // allows us to pass back the entire request to the callback
        },
        function(req, username, password, done) { // callback with email and password from our form
            req.getConnection(function(error, connection){
                connection.query("SELECT * FROM `USER` WHERE `username` = '" + username + "'", function (err, rows) {
                    if (err)
                        return done(err);
                    if (!rows.length) {
                        return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash
                    }
                    //console.log(rows[0].PASSWORD);
                    //console.log(password);
                    // if the user is found but the password is wrong
                    if (!( rows[0].PASSWORD == password))
                        return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata
                    //req.res.cookie('test','this is a test cookie');
                    //console.log(req.res);
                    // all is well, return successful user
                    return done(null, rows[0]);

                });
            });


        }));

};