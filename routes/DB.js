/**
 * Created by Ming on 4/4/2015 0004.
 */

//ADD_USER(USERNAME, PASSWORD, USERTYPE);

function checkPermission(req, minLevel){
    var result = {};
    if(req.user){
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
    if(req.user.USERTYPE==1&&input.usertype!=2){
        result.error="Instructor cannot create account other than student.";
    }
    if(result.error){
        res.send(result);
        return ;
    }else{

        req.getConnection(function (err, connection) {
            var data = {
                USERNAME    : input.username,
                PASSWORD : input.password,
                USERTYPE   : input.usertype
            };

            //TODO verify if username already exist before do a insert,

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

exports.delUser = function(req,res){
    var input = req.query;
    var result = checkPermission(req, 1);
    if(result.error){
        res.send(result);
        return ;
    }else{
        req.getConnection(function (err, connection) {
            //get user info first,
            // if the username is a selector, return error,
            // else  instructor can only delete student account.

            connection.query("SELECT FROM USER WHERE USERNAME = ? ",input.username, function(err,rows){
                if(err){
                    result.error = err;
                    res.send(result);
                }else if(rows.length!=1) {
                    result.error ="Cannot delete multiple account at once.";
                    res.send(result);
                }else{
                    if(req.user.USERTYPE==0   // admin
                        ||(req.user.USERTYPE==1&&rows[0].USERTYPE==2)){  // instructor try to delete student.
                        connection.query("DELETE FROM USER WHERE USERID = ? ",rows[0].USERID, function(err2, rows2){
                            if (err2){
                                result.error=err2;
                            }else{
                                result.data=rows2;
                            }
                            res.send(result);

                        });
                    }else{
                        result.error = "You do not have permission to delete requested account.";
                        res.send(result);
                    }
                }
            });
        });
    }

};

//ADD_FILE(USERID,FILENAME,JSON);
exports.addFile = function(req,res){
    var input = req.query;
    var result = checkPermission(req, 1);
    if(result.error){
        res.send(result);
        return ;
    }else{
        /*
         CREATE TABLE FILE(
         USERID INT(15) NOT NULL,
         FILENAME VARCHAR(32) NOT NULL,
         JSON TEXT NOT NULL,
         FOREIGN KEY (USERID) REFERENCES USER(USERID),
         PRIMARY KEY(USERID, FILENAME)
         );
         */
        req.getConnection(function (err, connection) {
            var data = {
                USERID    : req.user.USERID,
                FILENAME : input.filename,
                JSON   : input.contents
            };

            connection.query("INSERT INTO FILE set ? ",data, function(err, rows){
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

//DEL_FILE(USERID,FILENAME);
exports.delFile = function(req,res){
    var input = req.query;
    var result = checkPermission(req, 1);
    if(input.userid&&req.user.USERTYPE!=0){
        result.error = "Instructor cannot access other account.";
    }
    if(result.error){
        res.send(result);
        return ;
    }else{
        /*
         CREATE TABLE FILE(
         USERID INT(15) NOT NULL,
         FILENAME VARCHAR(32) NOT NULL,
         JSON TEXT NOT NULL,
         FOREIGN KEY (USERID) REFERENCES USER(USERID),
         PRIMARY KEY(USERID, FILENAME)
         );
         */
        req.getConnection(function (err, connection) {
            var userid = req.user.userid;
            if(input.userid){
                userid = input.userid;
            }
            connection.query("DELETE FROM FILE WHERE USERID = ? AND FILENAME = ?",[userid, input,filename], function(err, rows){
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

//ADD_EXCEPTION
exports.addException = function(req,res){
    var input = req.query;
    var result = checkPermission(req, 1);
    if(req.user.USERTYPE==1&&input.usertype!=2){
        result.error="Instructor cannot create account other than student.";
    }
    if(result.error){
        res.send(result);
        return ;
    }else{
        req.getConnection(function (err, connection) {
            var data = {
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
//REMOVE_EXCEPTION
exports.delException = function(req,res){
    var input = req.query;
    var result = checkPermission(req, 1);
    if(req.user.USERTYPE==1&&input.usertype!=2){
        result.error="Instructor cannot create account other than student.";
    }
    if(result.error){
        res.send(result);
        return ;
    }else{
        req.getConnection(function (err, connection) {
            var data = {
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
//UPDATE_EXCEPTION    -- should be called from java program,
exports.updateException = function(req,res){
    var input = req.query;
    var result = checkPermission(req, 1);
    if(req.user.USERTYPE==1&&input.usertype!=2){
        result.error="Instructor cannot create account other than student.";
    }
    if(result.error){
        res.send(result);
        return ;
    }else{
        req.getConnection(function (err, connection) {
            var data = {
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
//PRINT_EXCEPTION
exports.printException = function(req,res){
    var input = req.query;
    var result = checkPermission(req, 1);
    if(req.user.USERTYPE==1&&input.usertype!=2){
        result.error="Instructor cannot create account other than student.";
    }
    if(result.error){
        res.send(result);
        return ;
    }else{
        req.getConnection(function (err, connection) {
            var data = {
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
//ADD_CLASS
exports.addClass = function(req,res){
    var input = req.query;
    var result = checkPermission(req, 1);
    if(req.user.USERTYPE==1&&input.usertype!=2){
        result.error="Instructor cannot create account other than student.";
    }
    if(result.error){
        res.send(result);
        return ;
    }else{
        req.getConnection(function (err, connection) {
            var data = {
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
//DELETE_CLASS
exports.delClass = function(req,res){
    var input = req.query;
    var result = checkPermission(req, 1);
    if(req.user.USERTYPE==1&&input.usertype!=2){
        result.error="Instructor cannot create account other than student.";
    }
    if(result.error){
        res.send(result);
        return ;
    }else{
        req.getConnection(function (err, connection) {
            var data = {
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
//ADD_STUDENT_TO_CLASS
exports.addStudentToClass = function(req,res){
    var input = req.query;
    var result = checkPermission(req, 1);
    if(req.user.USERTYPE==1&&input.usertype!=2){
        result.error="Instructor cannot create account other than student.";
    }
    if(result.error){
        res.send(result);
        return ;
    }else{
        req.getConnection(function (err, connection) {
            var data = {
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
//DELETE_STUDENT_FROM_CLASS
exports.delStudentFromClass = function(req,res){
    var input = req.query;
    var result = checkPermission(req, 1);
    if(req.user.USERTYPE==1&&input.usertype!=2){
        result.error="Instructor cannot create account other than student.";
    }
    if(result.error){
        res.send(result);
        return ;
    }else{
        req.getConnection(function (err, connection) {
            var data = {
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
//ADD_RECORD
exports.addRecord = function(req,res){
    var input = req.query;
    var result = checkPermission(req, 1);
    if(req.user.USERTYPE==1&&input.usertype!=2){
        result.error="Instructor cannot create account other than student.";
    }
    if(result.error){
        res.send(result);
        return ;
    }else{
        req.getConnection(function (err, connection) {
            var data = {
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
//GET_RECORD
exports.getRecord = function(req,res){
    var input = req.query;
    var result = checkPermission(req, 1);
    if(req.user.USERTYPE==1&&input.usertype!=2){
        result.error="Instructor cannot create account other than student.";
    }
    if(result.error){
        res.send(result);
        return ;
    }else{
        req.getConnection(function (err, connection) {
            var data = {
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
//GET_FILELIST(USERID);
exports.getFiles = function(req,res){
    var input = req.query;
    var result = checkPermission(req, 2);
    if(result.error){
        res.send(result);
        return ;
    }else{
        /*
         CREATE TABLE FILE(
         USERID INT(15) NOT NULL,
         FILENAME VARCHAR(32) NOT NULL,
         JSON TEXT NOT NULL,
         );
         CREATE TABLE CLASS(
         CRN INT(15) NOT NULL UNIQUE,
         INSTRUCTOR INT(15) NOT NULL,
         );
         CREATE TABLE STUDENT(
         CRN INT(15) NOT NULL,
         STUDENT INT(15) NOT NULL
         );
         */
        //get class crn, then, find all instructor to this account, then fetch all file from the instructors.
        req.getConnection(function (err, connection) {
            var userid = req.user.userid;
            if(input.userid){
                userid = input.userid;
            }
            //TODO not sure if nested query work, if not, split to three queries.
            connection.query("SELECT * FROM FILE WHERE USERID IN " +
                                "(SELECT INSTRUCTOR FROM CLASS WHERE CRN IN " +
                                    "(SELECT CRN FROM STUDENT WHERE STUDENT = ?))"
                                            ,[userid, input,filename], function(err, rows){
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
//GET_FILE(USERID,FILENAME);
//
//
//
//ADD_CLASS(CRN,INSTRUCTOR); in progress
//DEL_CLASS(CRN);   in progress
//
//ADD_STUDENT(CRN, STUDENT); in progress
//DEL_STUDENT(CRN,STUDENT);  in progress
//GET_CLASS(STUDENT);  necessary?
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
//-- add class  INPROGRESS
//-- add file done
//-- list class
//-- list student
//-- list file
//-- remove file   done
//-- remove student  done
//-- remove class
//-- get student report
//-- add exception
//-- remove exception
//-- list exception by frequency
//
//
//
//