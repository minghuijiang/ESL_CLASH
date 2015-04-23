/**
 * Created by Ming on 4/4/2015 0004.
 */

var prefix = '';


module.exports = function(app, passport) {

    // HOME PAGE (with login links) ========
    app.get( '/',isLoggedIn, function ( request, response ) {
        response.render('main.ejs',{user:request.user});
    });
    // LOGIN ===============================
    app.get('/login', function(req, res) {
        res.render('login.ejs', { message: req.flash('loginMessage') });
    });
    // process the login form
    app.get('/authentication', passport.authenticate('local-login', {
            successRedirect : prefix+'/', // redirect to the secure profile section
            failureRedirect : prefix+'/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));
    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        console.log(req.user.USERNAME+' logout');
        req.logout();
        res.redirect(prefix+'/login');
    });

    var DB = require('./DB');

    app.get('/api/addUser',isLoggedIn,DB.addUser);
    app.get('/api/delUser',isLoggedIn,DB.delUser);
    app.post('/api/addFile',isLoggedIn,DB.addFile);

    app.get('/api/delFile',isLoggedIn,DB.delFile);
    app.get('/api/addException',isLoggedIn,DB.addException);
    app.get('/api/delException',isLoggedIn,DB.delException);
    app.get('/api/printException',isLoggedIn,DB.printException);
    app.get('/api/addClass',isLoggedIn,DB.addClass);
    app.get('/api/delClass',isLoggedIn,DB.delClass);
    app.get('/api/addStudent',isLoggedIn,DB.addStudent);
    app.get('/api/delStudent',isLoggedIn,DB.delStudent);
    app.get('/api/addRecord',isLoggedIn,DB.addRecord);
    app.get('/api/getRecord',isLoggedIn,DB.getRecord);
    app.get('/api/getFiles',isLoggedIn,DB.getFiles);
    app.get('/api/getFile',isLoggedIn,DB.getFile);
    app.get('/api/listUser',isLoggedIn,DB.listUser);
    app.get('/api/listClass',isLoggedIn,DB.listClass);
    app.get('/api/listStudent',isLoggedIn,DB.listStudent);
    //test version.
    app.get('/js/eventI.js',isLoggedIn,isInstructorOrAdmin);
    app.get('/js/eventA.js',isLoggedIn,isAdmin);

    app.post('/uploads',isLoggedIn,isInstructorOrAdmin,handleUploads);

    app.post('/slash',isLoggedIn,isInstructorOrAdmin,function(req,res){
        console.log(req.user.USERNAME+' request to slash text.');
        var text=req.body.text;
        parseText(text,req,res,1,10);
    })


};
var java = require('java'),
    PythonShell = require('python-shell'),
    spawn = require('child_process').spawn,
    fs = require('fs');

java.classpath.push("java/slash.jar");
var slash = java.newInstanceSync("main.Slash");

function parseText (msg,req, res,min,max,callback){
    var options = {
        args: [msg]
    };
    var result ={};
    PythonShell.run( 'parse_pos.py', options, function(err, results) {
        if (err) {
            console.log(req.user.USERNAME+' Error from python script: '+err);
            result.error = err;
            res.send(result);
        } else {
            // grep ExceptionList
            req.getConnection(function (err, connection) {
                connection.query("SELECT * FROM EXCEPTION WHERE USERID = ? ORDER BY COUNT DESC",req.user.USERID, function(err, rows){
                    var exception ='';
                    if (err){
                    }else{
                        for(var i=0;i<rows.length;i++){
                            exception+=rows[i].EX_STR+';';
                        }
                    }
                    console.log(req.user.USERNAME+' After get Exception: '+exception);
                    // results is an array consisting of messages collected during execution
                    /**
                     * read nltkInput and perform slash based on the algorithm, exception, and minimal, maximum token length.
                     *
                     * @param nltkInput
                     * @param exceptionList
                     *          Exception List is a string with multiple token, separated by ';'
                     *              from day to day;from year to year;
                     * @param minLength  [3, 10]
                     *          minimum length of a token,
                     *          this is a suggestion value,
                     *          the algorithm do not guaranteed the length will always be large than minLength
                     * @param maxLength , [7,12]
                     *          maximum length of a token,   # currently has no effect.
                     *          this is a suggestion value,
                     *          the algorithm do not guaranteed the length will always be less than maxLength
                     * @return
                     *
                     */
                    slash.parseSlash(results[0], exception ,min,max, function(error, data) {
                        console.log(req.user.USERNAME+' finish slash.');
                        if (error) {
                            console.log(req.user.USERNAME+' Error from slash.');
                            console.log(error);
                            result.error=error;
                            res.send(result);

                        } else {
                            result.data=data[0];
                            res.send(result);
                            var count = data[1].split(',');
                            for(var i=0;i<rows.length;i++){
                                var str = rows[i].EX_STR;
                                var c = parseInt(count[i]);
                                if(c>0)
                                    connection.query('UPDATE EXCEPTION SET COUNT=COUNT+? WHERE EX_STR =? AND USERID=?',
                                                    [c,str,rows[i].USERID],function(err2,rows2){
                                            if(err2)
                                                console.log(err2);
                                        })


                            }
                        }
                        if(callback)
                            callback();
                    });
                });

            });

        }
    });
}

function handleUploads(req,res){
    console.log('called handle uploads');
    var file = req.files.file;
    var file_extension = file.extension;
    var result = {};
    console.log(req.user.USERNAME+' request to slash upload document. file_extension: '+file_extension+' size: '+file.size);
    // check file size on client side.
    if((file.extensions=='txt'&&file.size>1024*1024)||// txt limit to 1mb
        ((file.extensions=='doc'||file.extensions=='docx'))&&file.size>5*1024*1024){//doc and docx limit to 5mb
        result.error ="File too big, txt file max size = 1Mb, doc or docx file max siz = 5Mb.";
        res.send(result);
        return ;
    }

    if (file_extension === 'docx'||file_extension === 'doc'||file_extension === 'txt'){
        var parse_msword = spawn('sh', [ 'parse_msword.sh', file.path ]);
        var output="";
        parse_msword.stdout.on('data', function (data) {    // register one or more handlers
            output+=data

        }).on('end',function(){

            console.log(req.user.USERNAME+' finished Spawn');
            parseText(output,req,res,1,10,function(){
                fs.unlink(file.path,function(err){
                    if(err)
                        console.log(err);
                });
            });
        });
        parse_msword.stderr.on('data', function (data) {
            console.log(req.user.USERNAME+' Standard Error from spawn: '+data);
            res.send(result);
            fs.unlink(file.path,function(err){
                if(err)
                    console.log(err);
            });
        });
    }else{// this should not happen., always check extension on client side before upload.
        console.log(req.user.USERNAME+' unsupport file format : '+file.extension);
        result.error='Unsupported file format';
        res.send(result);
        fs.unlink(file.path,function(err){
            if(err)
                console.log(err);
        });
    }
}

// route middleware to make sure
function isLoggedIn(req, res, next) {

    if (req.isAuthenticated()) {
        console.log(req.user.USERNAME+' Authenticated');
        return next();
    }

    // if they aren't redirect them to the home page
    res.redirect(prefix+'/login');
}

function isInstructorOrAdmin(req,res,next){
    console.log(req.user.USERNAME+' request Instructor action.');
    if(req.user.USERTYPE<=1)
        return next();
}

function isAdmin(req,res,next){
    console.log(req.user.USERNAME+' request Admin action.');
    if(req.user.USERTYPE==0)
        return next();
}