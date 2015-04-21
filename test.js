'use strict';

//Node application

var express = require('express'),
    app = express(),
    http = require('http').Server(app),
    io = require('socket.io')(http,{ resource: '/socket.io' }),
    connection  = require('express-myconnection'),
    PythonShell = require('python-shell'),
    mysql = require('mysql'),
    java = require("java"),
    morgan = require('morgan'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    passport = require('passport'),
    flash = require('connect-flash'),
    multer  = require('multer'),
    spawn = require('child_process').spawn,
    fs = require('fs');



    // setup java slasher.
    java.classpath.push("java/slash.jar");
    var slash = java.newInstanceSync("main.Slash");

    app.use(connection(mysql,{
        host: 'localhost',
        user: 'root',
        password : '',
        port : 3306, //port mysql
        database:'CLASH'
    },'request')); //TODO  use pool?

    var file_contents = '';
    app.use(multer({
      	dest: './uploads/',
      	rename: function (fieldname, filename) {
                return filename.replace(/\W+/g, '-').toLowerCase() + Date.now()
      		},
            onFileUploadComplete: function (file, req, res) {
                var file_extension = file.extension;
                var result = {};
                if (file_extension === 'docx'||file_extension === 'doc'||file_extension === 'txt'){
                    var parse_msword = spawn('sh', [ 'parse_msword.sh', file.path ]);
                    parse_msword.stdout.on('data', function (data) {    // register one or more handlers
                        parseText(data,req,res,2,10,function(){
                            fs.unlink(file.path,function(err){
                                if(err)
                                    console.log(err);
                            });
                        });
                    });
                    parse_msword.stderr.on('data', function (data) {
                        console.log('stderr '+data);
                        result.error='stderr: ' + data;
                        res.send(result);
                        fs.unlink(file.path,function(err){
                            if(err)
                                console.log(err);
                        });
                    });
                }else{// this should not happen., always check extension on client side before upload.
                    result.error='Unsupported file format';
                    fs.unlink(file.path,function(err){
                        if(err)
                            console.log(err);
                    });
                }
        }
            
	}));
    // initialize passport
    require('./routes/passport')(passport); // pass passport for configuration

    //set morgan
    morgan('combined',{
        skip: function(req,res) {return res.statusCode < 400}
    });


    // set views
    app.set('views', __dirname + '/views');
    app.engine('html', require('ejs').renderFile);
    app.set('view engine', 'ejs');

// set middleware
    app.use(morgan('combined'));
    app.use(methodOverride('X-HTTP-Method-Override'));
    app.use(cookieParser()); // read cookies (needed for auth)
    app.use(bodyParser.urlencoded() ); // get information from html forms
    app.use(session({
        secret: 'CLASH top secret'
    })); // session secret
    app.use(passport.initialize());
    app.use(passport.session()); // persistent login sessions
    app.use(flash()); // use connect-flash for flash messages stored in session


// open public folder
app.use(express.static(__dirname + '/public'));

// routes ======================================================================
require('./routes/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport

//Socket.IO and python-shell

var sessionsConnections = {};
io.on('connection', function(socket) {
    sessionsConnections[socket.handshake.sessionID] = socket;

    console.log('connected to client -= =====================');

        /*
            FILE PROCESSING
        */

    socket.on('file',function(msg){
        //console.log('new file');
        //console.log(msg);
        //console.log("in file socket on server and file_contents: " + file_contents);
        msg = file_contents.trim();
        console.log("file socket msg: " + msg);

        var options = {
            args: [msg]
        };

        PythonShell.run( 'parse_pos.py', options, function(err, results) {
            if (err) {
                console.log('IN FILE: error from python: ' + err.stack);
                console.log(results);
                socket.emit('IN FILE: response', err);
            } else {
                // results is an array consisting of messages collected during execution
                console.log("IN FILE: from python: "+results);
                /**
                 * read nltkInput and perform slash based on the algorithm, exception, and minimal, maximum token length.
                 * 
                 * @param nltkInput
                 *          input return from parse_pos.py, in formate
                 *          [   
                 *              [ //paragraph level
                 *                  [ // sentence level
                 *                      "word1","pos1",
                 *                      "word2","pos2",
                 *                      ...
                 *                  ],
                 *                  [// sentence 2
                 *                      ...
                 *                  ],
                 *                      .....
                 *              ],
                 *              [ //paragraph 2
                 *                  ...
                 *              ],
                 *              ....
                 *          ]
                 * @param exceptionList
                 *          Exception List is a string with multiple token, separated by ';'
                 *          i.e.:
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
                slash.parseSlash(results[0], 'from day to day;from year to year',2,7, function(error, data) {
                    if (error) {
                        console.log('IN FILE: err from java: ' + error);
                        socket.emit('response', error);
                    } else {
                        socket.emit('response', data);
                    }
                });
            }
        });
    });





        /*
            PLAIN TEXT PROCESSING
        */

    
    socket.on('text', function(msg) {
        var options = {
            args: [msg]
        };

        PythonShell.run( 'parse_pos.py', options, function(err, results) {
            if (err) {
                console.log('error from python: ' + err.stack);
                console.log(results);
                socket.emit('response', err);
            } else {
                // results is an array consisting of messages collected during execution
                console.log("IN PLAIN TEXT: from python: "+results);
				/**
				 * read nltkInput and perform slash based on the algorithm, exception, and minimal, maximum token length.
				 * 
				 * @param nltkInput
				 * 			input return from parse_pos.py, in formate
				 * 			[	
				 * 				[ //paragraph level
				 * 					[ // sentence level
				 * 						"word1","pos1",
				 * 						"word2","pos2",
				 * 						...
				 * 					],
				 * 					[// sentence 2
				 * 						...
				 * 					],
				 * 						.....
				 * 				],
				 * 				[ //paragraph 2
				 * 					...
				 * 				],
				 * 				....
				 * 			]
				 * @param exceptionList
				 * 			Exception List is a string with multiple token, separated by ';'
				 * 			i.e.:
				 * 				from day to day;from year to year;
				 * @param minLength  [3, 10]
				 * 			minimum length of a token, 
				 * 			this is a suggestion value, 
				 * 			the algorithm do not guaranteed the length will always be large than minLength
				 * @param maxLength , [7,12]
				 * 			maximum length of a token,   # currently has no effect.
				 * 			this is a suggestion value, 
				 * 			the algorithm do not guaranteed the length will always be less than maxLength
				 * @return
				 * 			
				 */
                slash.parseSlash(results[0], 'from day to day;from year to year',2,7, function(error, data) {
                    if (error) {
                        console.log('err from java: ' + error);
                        socket.emit('response', error);
                    } else {
                        socket.emit('response', data);
                    }
                });
            }
        });
    });
});



http.listen(3000, function(){
    console.log('Express server listening on port %d in %s mode',http.address().port, app.settings.env);
});


function parseText(msg,req, res,min,max,callback){
    var options = {
        args: [msg]
    };
    var result ={};
    PythonShell.run( 'parse_pos.py', options, function(err, results) {
        console.log(err);
        console.log(results);
        if (err) {
            console.log('IN FILE2: error from python: ' + err.stack);
            result.error = err;
            res.send(result);
        } else {
            // grep ExceptionList
            req.getConnection(function (err, connection) {
                connection.query("SELECT * FROM EXCEPTION WHERE USERID = ? ORDER BY COUNT",req.user.USERID, function(err, rows){
                    var exception ='';
                    if (err){
                    }else{
                        for(var i=0;i<rows.length;i++){
                            exception+=rows[i].EX_STR+';';
                        }
                    }
                    console.log(exception);
                    // results is an array consisting of messages collected during execution
                    console.log("IN FILE: from python: "+results);
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
                        if (error) {
                            result.error=error;
                        } else {
                            result.data=data;
                        }
                        res.send(result);
                        callback();
                    });
                });

            });

        }
    });
}



