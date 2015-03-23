
//ADD_USER(USERNAME, PASSWORD, USERTYPE);

exports.addUser = function(req,res){
    var input = JSON.parse(JSON.stringify(req.body));

    req.getConnection(function (err, connection) {

        var data = {

            name    : input.name,
            address : input.address,
            email   : input.email,
            phone   : input.phone

        };

        var query = connection.query("INSERT INTO user set ? ",data, function(err, rows)
        {

            if (err)
                console.log("Error inserting : %s ",err );

            res.redirect('/customers');

        });

        // console.log(query.sql); get raw query

    });
};
//DEL_USER(USERNAME);

exports.delUser = function(req, res){
    req.getConnection(function(err,connection){
        connection.query('SELECT * FROM customer',function(err,rows)     {
            if(err)
                console.log("Error Selecting : %s ",err );
            res.render('customers',{page_title:"Customers - Node.js",data:rows});

        });
    });
};

//ADD_FILE(USERID,FILENAME,JSON);
exports.addFile = function(req, res){
    req.getConnection(function(err,connection){
        connection.query('SELECT * FROM customer',function(err,rows)     {
            if(err)
                console.log("Error Selecting : %s ",err );
            res.render('customers',{page_title:"Customers - Node.js",data:rows});

        });
    });
};

//DEL_FILE(USERID,FILENAME);
exports.delFile = function(req, res){
    req.getConnection(function(err,connection){
        connection.query('SELECT * FROM customer',function(err,rows)     {
            if(err)
                console.log("Error Selecting : %s ",err );
            res.render('customers',{page_title:"Customers - Node.js",data:rows});

        });
    });
};

//IF_EXIST_FILE(USERID,FILENAME);
//GET_FILELIST(USERID);
//GET_FILE(USERID,FILENAME);
//
//
//
//ADD_CLASS(CRN,INSTRUCTOR);
//DEL_CLASS(CRN);
//
//ADD_STUDENT(CRN, STUDENT);
//DEL_STUDENT(CRN,STUDENT);
//GET_CLASS(STUDENT);
//
//ADD_RECORD(USERID,INSTRUCTORID, FILENAME,TIME_SPENT_SEC,WORD_READ,LB_READ,REGRESSION,FIXATION);
//
//INSERT INTO RECORD VALUES(USERID, INSTRUCTORID, FILENAME,TIME_SPENT_SEC,WORD_READ,LB_READ,REGRESSION,FIXATION);
//
//GET_RECORD(STUDENT);
//SELECT * FROM RECORD WHERE USERID = STUDENT;
//
//GET_RECORD(STUDENT,INSTRUCTOR);
//SELECT * FROM RECORD WHERE USERID = STUDENT AND INSTRUCTORID = INSTRUCTOR;
//
//
//ADD_EXCEPTION(USERID,EX_STR);
//INSERT INTO EXCEPTION VALUES(USERID, EX_STR,0);
//
//INC_COUNT(USERID,EX_STR,NUM);
//UPDATE EXCEPTION
//SET COUNT = COUNT + NUM
//WHERE
//DEL_EXCEPTION(USERID,EX_STR);
//PRINT(USERID);
//
//
//-- login ----student   	-- getListFile
//-- getReport
//
//----Instructor -- add student
//-- add class
//-- add file
//-- list class
//-- list student
//-- list file
//-- remove file
//-- remove student
//-- remove class
//-- get student report
//-- add exception
//-- remove exception
//-- list exception by frequency
//
//
//
//





/*
 * GET customers listing.
 */
exports.list = function(req, res){
    req.getConnection(function(err,connection){

        connection.query('SELECT * FROM customer',function(err,rows)     {

            if(err)
                console.log("Error Selecting : %s ",err );

            res.render('customers',{page_title:"Customers - Node.js",data:rows});

        });

    });

};



exports.add = function(req, res){
    res.render('add_customer',{page_title:"Add Customers-Node.js"});
};
exports.edit = function(req, res){

    var id = req.params.id;
    req.getConnection(function(err,connection){
        connection.query('SELECT * FROM customer WHERE id = ?',[id],function(err,rows)
        {

            if(err)
                console.log("Error Selecting : %s ",err );

            res.render('edit_customer',{page_title:"Edit Customers - Node.js",data:rows});

        });

    });
};
/*Save the customer*/
exports.save = function(req,res){

    var input = JSON.parse(JSON.stringify(req.body));

    req.getConnection(function (err, connection) {

        var data = {

            name    : input.name,
            address : input.address,
            email   : input.email,
            phone   : input.phone

        };

        var query = connection.query("INSERT INTO customer set ? ",data, function(err, rows)
        {

            if (err)
                console.log("Error inserting : %s ",err );

            res.redirect('/customers');

        });

        // console.log(query.sql); get raw query

    });
};/*Save edited customer*/
exports.save_edit = function(req,res){

    var input = JSON.parse(JSON.stringify(req.body));
    var id = req.params.id;

    req.getConnection(function (err, connection) {

        var data = {

            name    : input.name,
            address : input.address,
            email   : input.email,
            phone   : input.phone

        };

        connection.query("UPDATE customer set ? WHERE id = ? ",[data,id], function(err, rows)
        {

            if (err)
                console.log("Error Updating : %s ",err );

            res.redirect('/customers');

        });

    });
};

exports.delete_customer = function(req,res){

    var id = req.params.id;

    req.getConnection(function (err, connection) {

        connection.query("DELETE FROM customer  WHERE id = ? ",[id], function(err, rows)
        {

            if(err)
                console.log("Error deleting : %s ",err );

            res.redirect('/customers');

        });

    });
};