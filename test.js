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
    flash = require('connect-flash');



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

    console.log('connected to client -======================');
    socket.on('file',function(msg){
        console.log('new file');
        console.log(msg);
    })
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
                console.log("from python: "+results);
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


http.listen(4000, function(){
    console.log('Express server listening on port %d in %s mode',http.address().port, app.settings.env);
});





