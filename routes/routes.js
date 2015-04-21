/**
 * Created by Ming on 4/4/2015 0004.
 */

var prefix = '';


module.exports = function(app, passport) {

    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    app.get( '/',isLoggedIn, function ( request, response ) {
        response.render('main.ejs',{user:request.user});
    });

    // =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form
    app.get('/login', function(req, res) {
        // render the page and pass in any flash data if it exists
        res.render('login.ejs', { message: req.flash('loginMessage') });
    });

    // process the login form
    app.get('/authentication', passport.authenticate('local-login', {
            successRedirect : prefix+'/', // redirect to the secure profile section
            failureRedirect : prefix+'/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect(prefix+'/login');
    });
    var DB = require('./DB');
    app.get('/api/addUser',DB.addUser);
    app.get('/api/delUser',DB.delUser);
    app.post('/api/addFile',DB.addFile);

    app.get('/api/delFile',DB.delFile);
    app.get('/api/addException',DB.addException);
    app.get('/api/delException',DB.delException);
    app.get('/api/printException',DB.printException);
    app.get('/api/addClass',DB.addClass);
    app.get('/api/delClass',DB.delClass);
    app.get('/api/addStudent',DB.addStudent);
    app.get('/api/delStudent',DB.delStudent);
    app.get('/api/addRecord',DB.addRecord);
    app.get('/api/getRecord',DB.getRecord);
    app.get('/api/getFiles',DB.getFiles);
    app.get('/api/getFile',DB.getFile);
    app.get('/api/listUser',DB.listUser);
    app.get('/api/listClass',DB.listClass);
    app.get('/api/listStudent',DB.listStudent);
    app.post('/uploads',isLoggedIn,isInstructorOrAdmin,function(req,res){
       //res.send('Post success');
    });


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

function isInstructorOrAdmin(req,res,next){
    if(req.user.USERTYPE<=1)
        return next();
    res.redirect('/');
}

function isAdmin(req,res,next){
    if(req.user.USERTYPE==0)
        return next();
    res.redirect('/');
}