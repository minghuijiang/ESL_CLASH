var java = require("java");
   
   java.classpath.push("test.jar");//Needs to be on the same path as of .js file
   
   var clasis = java.newInstanceSync("org.TestClass");
   
   clasis.print("never",233,"again", function (error,data)
     { 
       console.log("Returned data"+data);

     });

   
   clasis.wait(5, function (error, data)
	{
	 console.log("Returned data "+data);
	 console.log("Error:  "+error);
	});

console.log("after method: ");
