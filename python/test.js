'use strict';

//Node application
//var 
  //http = require( 'http' ),
  //express = require( 'express' ),
  //app = express(),
  //url = require('url'),
  //io = require('socket.io'),

  //server = http.createServer( app );
  
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var PythonShell = require('python-shell');



http.listen(9999, function(){
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


  
  app.get( '/', function ( request, response ) {
  	response.send( 'Hello World from Node with Express and nodemon!' );
});

//test.html
  app.get('/test.html', function (request, response){
    var options = {
    	root: __dirname,// + '/public/',
    	dotfiles: 'deny',
    	headers: {
        	'x-timestamp': Date.now(),
        	'x-sent': true
    	}
  };	

    var fileName = '/test.html';
    
   response.sendFile(fileName, options, function (err) {
     if(err) {
    	if (err.code === "ECONNABORT" && response.statusCode == 304) {
      		// No problem, 304 means client cache hit, so no data sent
      		console.log('304 cache hit for ' + fileName);
      		return;
    	}
    console.error("SendFile error:", err, " (status: " + err.status + ")");
    
	if (err.status) {
	      response.status(err.status).end();
    	}
  }
  else {
    console.log('Sent:', fileName);
  }
  });

});



//Socket.IO and python-shell
io.on('connection', function(socket){
    sessionsConnections[socket.handshake.sessionID] = socket;
    
    console.log('connected to client')
    
    socket.on('text', function(msg){
		console.log('input: '+msg);
		var options = {
		  args: [msg.replace("â","")]
		};
		console.log('options: '+options);
		
		PythonShell.run('parse_pos.py',options, function (err, results) {
		  if (err) 
			throw err;
		  // results is an array consisting of messages collected during execution 
		  console.log('result: '+results);
		  var java = require("java");
		  console.log('after require')
		   java.classpath.push("test.jar");//Needs to be on the same path as of .js file
		   console.log('after push')
		   var clasis = java.newInstanceSync("org.TestClass");
		   console.log('after clasis')
		   clasis.print(results[0],1,'aaa', function (error,data)
			 { 
				if(error){
					console.log('err: '+error);
					socket.emit('response', error);
				}else{
					console.log("Returned data "+data);
					socket.emit('response', data);
				}
				
			   

			 });
			 console.log('after method')
		});
		console.log('\n\n===============================after io and pos\n\n')
  });
});







