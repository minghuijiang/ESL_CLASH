/**
 * Created by Ming on 4/4/2015 0004.
 */
// app/routes.js

var prefix = '/dev';
module.exports = function(app, passport) {

    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    //app.get('/', function(req, res) {
    //    console.log('render /');
    //    res.render('index.ejs'); // load the index.ejs file
    //});

    // =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form
    app.get('/login', function(req, res) {
        console.log('render /login');
        // render the page and pass in any flash data if it exists
        res.render('login.ejs', { message: req.flash('loginMessage') });
    });

    // process the login form
    app.get('/logins', passport.authenticate('local-login', {
            successRedirect : prefix+'/profile', // redirect to the secure profile section
            failureRedirect : prefix+'/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }),
        function(req, res) {
            console.log("hello");
            res.redirect(prefix+'/login');
        });

    // =====================================
    // SIGNUP ==============================
    // =====================================
    // show the signup form
    app.get('/signup', function(req, res) {
        // render the page and pass in any flash data if it exists
        res.render('signup.ejs', { message: req.flash('signupMessage') });
    });

    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : prefix+'/profile', // redirect to the secure profile section
        failureRedirect : prefix+'/signup', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

    // =====================================
    // PROFILE SECTION =========================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    app.get('/profile', isLoggedIn, function(req, res) {
        res.render('profile.ejs', {
            user : req.user // get the user out of session and pass to template
        });
    });

    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect(prefix+'/login');
    });

    var DB = require('./DB');
    app.get('/api/addUser',DB.addUser());
};

// route middleware to make sure
function isLoggedIn(req, res, next) {

    if (req.isAuthenticated()) {
        console.log('after authenticated');
        return next();
    }

    // if they aren't redirect them to the home page
    res.redirect(prefix+'/login');
}