'use strict';

//Node application
//var 
  //http = require( 'http' ),
  //express = require( 'express' ),
  //app = express(),
  //url = require('url'),
  //io = require('socket.io'),

  //server = http.createServer( app );
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var PythonShell = require('python-shell');
var mysql      = require('mysql');

/**
  MYSQL
**/

var connection = mysql.createConnection({
  host     : 'esl-clash.cs.odu.edu',
  port     : '3306',
  database : 'CLASH'
});

connection.query(' SELECT * FROM USER', function(err, rows) {
     if(err){
        console.log(err.code);
     }
     else{
       console.log(rows);
     }
});


http.listen(3000, function(){
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

	app.get('/about', function (req, res)
	{
		res.render('about.html');
	});

  
  app.get( '/', function ( request, response ) {
  	response.send( 'Hello World from Node with Express and nodemon!' );
});

//test.html
  app.get('/test.html', function (request, response){
    request.render('index.html');
  });

});



//Socket.IO and python-shell
io.on('connection', function(socket) {
    sessionsConnections[socket.handshake.sessionID] = socket;

    console.log('connected to client')

    socket.on('text', function(msg) {
        console.log('input: ' + msg);
        var options = {
            args: [msg]
        };
        console.log('options: ' + options);

        PythonShell.run('parse_pos.py', options, function(err, results) {
            if (err) {
                console.log('error from python: ' + error);
                socket.emit('response', error);
            } else {
                // results is an array consisting of messages collected during execution 
                console.log('result: ' + results);
				
                var java = require("java");
                java.classpath.push("slash.jar"); //Needs to be on the same path as of .js file
                var slash = java.newInstanceSync("main.Slash");
				
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
                slash.parseSlash(results[0], 'from day to day;from year to year',3,7, function(error, data) {
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
        console.log('\n\n===============================after io and pos\n\n')
    });
});

// open public folder
app.use(express.static(__dirname + '/public'));






