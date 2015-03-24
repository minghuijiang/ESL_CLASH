'use strict';

//Node application

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var PythonShell = require('python-shell');
var mysql = require('mysql');
var java = require("java");
java.classpath.push("java/slash.jar");
var slash = java.newInstanceSync("main.Slash");

http.listen(4000, function(){
  console.log('Express server listening on port %d in %s mode',http.address().port, app.settings.env);
});


var sessionsConnections = {};


//Express Middleware
var 
  morgan = require('morgan'),
  bodyParser = require('body-parser'),
  methodOverride = require('method-override');
  

  app.use(morgan('combined'));
  app.use(bodyParser.json());
  app.use(methodOverride('X-HTTP-Method-Override'));

  
  morgan('combined',{
  	skip: function(req,res) {return res.statusCode < 400} 
  });

	app.set('views', __dirname + '/views');
	app.engine('html', require('ejs').renderFile);

	app.set('view engine', 'ejs');

  
  app.get( '/', function ( request, response ) {
      response.render('index.html');
});

  //test2.html
  app.get('/test2.html', function (request, response){
    response.render('index.html');
  });

    // open public folder
    app.use(express.static(__dirname + '/public'));

//Socket.IO and python-shell

io.of('/dev').on('connection', function(socket) {
    sessionsConnections[socket.handshake.sessionID] = socket;

    console.log('connected to client')

    socket.of('/dev').on('text', function(msg) {
        var options = {
            args: [msg]
        };

        PythonShell.run( 'parse_pos.py', options, function(err, results) {
            if (err) {
                console.log('error from python: ' + error);
                socket.emit('response', error);
            } else {
                // results is an array consisting of messages collected during execution
                console.log('result: '+results[0]);

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
                        console.log("Returned data " + data);
                        socket.emit('response', data);
                    }
                });
            }
        });
    });
});







