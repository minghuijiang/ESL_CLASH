/**
 * Created by Ming on 4/4/2015 0004.
 */

//ADD_USER(USERNAME, PASSWORD, USERTYPE);

function checkPermission(req, minLevel){
    var result = {
        data:""
    };
    if(req.user!=undefined){
        if(req.user.USERTYPE<=minLevel){ // user with minimal permission.

        }else{
            result.error = "Unauthorized action.";
        }
    }else{  // requests from unknown source.
        result.error="Login first.";
    }
    return result;
}

exports.addUser = function(req,res){
    var input = req.query;
    var result = checkPermission(req, 1);
    if(result.error){
        res.send(result);
        return ;
    }else{
        // check permission level 1 can only create user with level 0,
        // permission 2 can create user with level 1 or 2.
        //TODO

        req.getConnection(function (err, connection) {
            var data = {
                USERNAME    : input.username,
                PASSWORD : input.password,
                USERTYPE   : input.usertype
            };

            connection.query("INSERT INTO USER set ? ",data, function(err, rows){
                if (err){
                    result.error=err;
                }else{
                    result.data=rows;
                }
                res.send(result);

            });

        });
    }

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