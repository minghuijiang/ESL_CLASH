/**
 * Created by Ming on 4/4/2015 0004.
 */

/**
 *  helper funtion to determine if minimum privilege met.
 * @param req
 * @param minLevel
 * @returns {{}}
 */
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


function sql(req,query,data,callback){
    req.getConnection(function(err,connection){
        connection.query(query,data,callback);
    });
}
function test(err,rows){
    logAndSend(res,err,'ok');
}
exports.changeName = function(req,res){
    var input = req.query;
    var result = checkPermission(req, 2);
    if(result.error){
        res.send(result);

    }else{
        sql(req,"UPDATE USER set ? WHERE USERID= ?",
            [   {
            FNAME:          input.fname,
            LNAME:          input.lname
             },req.user.USERID],test);
        //req.getConnection(function (err, connection) {
        //    var data = {
        //        FNAME:          input.fname,
        //        LNAME:          input.lname
        //    };
        //    connection.query("UPDATE USER set ? WHERE USERID= ?",[data,req.user.USERID], function(err, rows){
        //        logAndSend(res,err,'ok');
        //    });
        //});
    }

};



exports.selfEnrollment = function(req,res){

};


exports.changePassword = function(req,res){
    var input = req.query;
    var result = checkPermission(req, 2);
    if(req.user.USERNAME=='instructor'){
        result.error='This is a dummy account, Do not change password.';
    }
    if(result.error){
        res.send(result);
    }else{

        req.getConnection(function (err, connection) {
            var data = {
                PASSWORD :      input.password
            };

            //TODO verify if username already exist before do a insert,
            // not necessary for prototype
            connection.query("UPDATE USER set ? WHERE USERID =? AND PASSWORD = ?",[data,req.user.USERID,input.oldPass], function(err, rows){
                logAndSend(res,err,rows,function(){
                    if(rows.affectedRows==0){
                        result.error='You enter the wrong password.'
                    }else{
                        result.data='ok';
                    }
                    res.send(result);
                })

            });

        });
    }

};




/**
 * ADD  user,
 *      Instructor mode
 *          - username
 *          - password
 *      Admin Mode
 *          - username
 *          - password
 *          - usertype   (optional)
 * @param req
 * @param res
 */
exports.addUser = function(req,res){
    var input = req.query;
    var result = checkPermission(req, 1);
    var usertype = 2; // default account with student privilege.
    if(input.usertype)
        usertype=input.usertype;
    if(usertype!=2&&req.user.USERTYPE==1){
        result.error="Instructor can only create student account";
    }

    if(!input.username||input.username.length==0 ||!input.password||input.password.length==0){
        result.error('Parameters Error.');
    }

    if(result.error){
        res.send(result);

    }else{

        req.getConnection(function (err, connection) {
            var data = {
                USERNAME    :   input.username,
                FNAME:          input.fname,
                LNAME:          input.lname,
                PASSWORD :      input.password,
                USERTYPE   :    usertype
            };

            connection.query("SELECT USERID FROM USER WHERE USERNAME = ?",input.username,function(err, rows){
                if(err){
                    logError(err);
                    result.error = err;
                    res.send(result);
                }else if(rows.length!=0){
                    result.error = "User exist.";
                    res.send(result);
                }else{
                    connection.query("INSERT INTO USER set ? ",data, function(err, rows){
                        if (err){
                            result.error=err;
                        }else{
                            result.data=rows;
                        }
                        res.send(result);
                    });
                }
            })



        });
    }

};

/**
 * remove user,
 *      -Instructor
 *          -username
 *      -admin
 *          -username
 * @param req
 * @param res
 */
exports.delUser = function(req,res){
    var input = req.query;
    var result = checkPermission(req, 1);
    if(result.error){
        res.send(result);
    }else{
        req.getConnection(function (err, connection) {
            //get user info first,
            // if the username is a selector, return error,
            // else  instructor can only delete student account.
            connection.query("SELECT * FROM USER WHERE USERNAME = ? ",input.username, function(err,rows){
                if(err){
                    result.error = err;
                    res.send(result);
                }else if(rows.length!=1) {
                    if(rows.length==0)
                        result.error="Request account '"+input.username+"' do not exist.";
                    else
                        result.error ="Cannot delete multiple accounts at once.";
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

/**
 * add a file
 *      -instructor
 *          -filename
 *          -contents
 *      -admin
 *          -filename
 *          -contents
 * @param req
 * @param res
 */
exports.addFile = function(req,res){
    var input = req.body;  // use body for post request.
    var result = checkPermission(req, 1);
    if(result.error){
        res.send(result);

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
        console.log(input.overwrite);
        var overwrite = input.overwrite;
        if(overwrite=='true'){//overwrite
            req.getConnection(function (err, connection) {
                var data = {
                    USERID    : req.user.USERID,
                    FILENAME : input.filename,
                    JSON   : input.contents
                };
                console.log('update file ');
                connection.query("UPDATE FILE set JSON = ? WHERE USERID=? AND FILENAME = ? ",
                                        [input.contents,req.user.USERID,input.filename], function(err, rows){
                    if (err){
                        result.error=err;
                    }else{
                        rows.USERID= req.user.USERID;
                        result.data=rows;
                    }
                    res.send(result);

                });

            });
        }else{
            req.getConnection(function (err, connection) {
                var data = {
                    USERID    : req.user.USERID,
                    FILENAME : input.filename,
                    JSON   : input.contents
                };
                console.log('add new file');
                connection.query("INSERT INTO FILE set ? ",data, function(err, rows){
                    if (err){
                        result.error=err;
                    }else{
                        console.log(rows);
                        rows.USERID= req.user.USERID;
                        result.data=rows;
                    }
                    res.send(result);

                });

            });
        }

    }
};


exports.checkFile = function(req,res){
    var input = req.query;  // use body for post request.
    var result = checkPermission(req, 1);
    if(result.error){
        res.send(result);
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
            connection.query("SELECT * FROM FILE WHERE FILENAME = ? AND USERID = ? ",[input.filename,req.user.USERID], function(err, rows){
                if (err){
                    console.log(err);
                    result.error=err;
                }else{
                    console.log(rows);
                    if(rows.length==0)
                        result.data=true;
                    else
                        result.data=false;
                }
                res.send(result);

            });

        });
    }
};

/**
 * del a file
 *      -instructor
 *          -filename
 *      -admin
 *          -filename
 *          -userid  (optional)
 * @param req
 * @param res
 */
exports.delFile = function(req,res){
    var input = req.query;
    var result = checkPermission(req, 1);
    if(input.userid&&req.user.USERTYPE!=0){
        result.error = "Instructor cannot access other account.";
    }
    if(result.error){
        res.send(result);

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
            if(req.user.USERTYPE==1){// INSTRUCTOR
                connection.query("DELETE FROM FILE WHERE FILENAME = ? AND USERID =? ",
                                            [input.filename,req.user.USERID], function(err, rows){
                    if (err){
                        result.error=err;
                    }else{
                        result.data=rows;
                    }
                    res.send(result);

                });
            }else if(req.user.USERTYPE==0){// ADMIN
                connection.query("DELETE FROM FILE WHERE FILENAME = ? AND USERID IN " +
                "(SELECT USERID FROM USER WHERE USERNAME = ?)",[input.filename,input.username], function(err, rows){
                    if (err){
                        result.error=err;
                    }else{
                        result.data=rows;
                    }
                    res.send(result);

                });
            }


        });
    }
};

exports.getFile = function(req,res){
    var input = req.query;
    var result = checkPermission(req, 2);

    if(result.error){
        res.send(result);

    }else{

        req.getConnection(function (err, connection) {
            if(req.user.USERTYPE==0){
                connection.query("SELECT * FROM FILE WHERE FILENAME = ? AND USERID = ?",
                                [input.filename, input.userid], function(err,rows){
                        if (err){
                            result.error=err;
                        }else{
                            result.data=rows;
                        }
                        res.send(result);
                    });
            }else if(req.user.USERTYPE==1){// INSTRUCTOR
                connection.query("SELECT * FROM FILE WHERE FILENAME = ? AND USERID = ?",
                    [input.filename,req.user.USERID], function(err, rows){
                        if (err){
                            result.error=err;
                        }else{
                            result.data=rows;
                        }
                        res.send(result);
                    });
            }else if(req.user.USERTYPE==2){// student    crn and filename
                connection.query("SELECT STUDENT FROM STUDENT WHERE CRN = ? AND STUDENT = ?",
                            [input.crn,req.user.USERID],function(err, rows){
                    if (err){
                        result.error=err;
                        res.send(result);

                    }else if(rows.length!=1) {
                        if(rows.length==0)
                            result.error = "You are not in the class.";
                        else
                            result.error ="Row size > 1, call Admin for more detail.";
                        res.send(result);
                    }else { // this student have class with this instructor.
                        connection.query("SELECT * FROM FILE WHERE FILENAME = ? AND USERID IN " +
                        "(SELECT INSTRUCTOR FROM CLASS WHERE CRN = ?)",[input.filename,input.crn],function(err2, rows2){
                            if (err2){
                                console.log(err2);
                                result.error=err2;
                            }else if(rows2.length!=1) {
                                if(rows2.length==0)
                                    result.error = "Class : "+crn+" do not have file named: "+input.filename;
                                else{
                                    result.error = "Multiple rows found, call admin for more detail.";
                                }

                            }else { // this student have class with this instructor.
                                result.data=rows2;
                            }
                            res.send(result);

                        })
                    }

                });
            }


        });
    }
};

/**
 * add exception
 *      -instructor
 *          -exception
 *      -admin
 *          -exception
 * @param req
 * @param res
 */
exports.addException = function(req,res){
    var input = req.query;
    var result = checkPermission(req, 1);
    if(result.error){
        res.send(result);

    }else{
        req.getConnection(function (err, connection) {
            /*
             CREATE TABLE EXCEPTION(
                 USERID INT(15) NOT NULL,
                 EX_STR VARCHAR(128) NOT NULL,
                 COUNT INT(8) NOT NULL DEFAULT 0,
             );
             */
            var data = {
                USERID: req.user.USERID,
                EX_STR: input.exception,
                COUNT: 0
            };
            connection.query("INSERT INTO EXCEPTION set ? ",data, function(err, rows){
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

/**
 * del exception
 *      -instructor
 *          -exception
 *      -admin
 *          -exception
 * @param req
 * @param res
 */
exports.delException = function(req,res){
    var input = req.query;
    var result = checkPermission(req, 1);
    if(result.error){
        res.send(result);

    }else{
        req.getConnection(function (err, connection) {
            /*
             CREATE TABLE EXCEPTION(
             USERID INT(15) NOT NULL,
             EX_STR VARCHAR(128) NOT NULL,
             COUNT INT(8) NOT NULL DEFAULT 0,
             );
             */
            connection.query("DELETE FROM EXCEPTION WHERE USERID = ? AND EX_STR = ?",[req.user.USERID, input.exception], function(err, rows){
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

/**
 * return user's exception list order by count.
 *      no data need.
 * @param req
 * @param res
 */
exports.printException = function(req,res){
    var input = req.query;
    var result = checkPermission(req, 1);

    if(result.error){
        res.send(result);

    }else{
        req.getConnection(function (err, connection) {
            connection.query("SELECT * FROM EXCEPTION WHERE USERID = ? ORDER BY COUNT DESC",req.user.USERID, function(err, rows){
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
/**
 * add new class
 *      -instructor
 *          -crn
 *          -classname
 *      -admin
 *          -crn
 *          -classname
 *
 * @param req
 * @param res
 */
exports.addClass = function(req,res){
    var input = req.query;
    var result = checkPermission(req, 1);

    if(result.error){
        res.send(result);

    }else{
        req.getConnection(function (err, connection) {
            /*
             CREATE TABLE CLASS(
                 CRN INT(15) NOT NULL UNIQUE,
                 INSTRUCTOR INT(15) NOT NULL,
                 CLASSNAME VARCHAR(32),
             );
             */
            var data = {
                CRN : input.crn,
                INSTRUCTOR: req.user.USERID,
                CLASSNAME: input.classname
            };
            connection.query("INSERT INTO CLASS set ? ",data, function(err, rows){
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

/**
 * del a class
 *      -admin
 *          -crn
 * @param req
 * @param res
 */
exports.delClass = function(req,res){
    var input = req.query;
    var result = checkPermission(req, 2);
    var instructor = req.user.USERID;
    if(req.user.USERTYPE==0&&input.instructor){
        instructor = input.instructor;
    }
    if(result.error){
        res.send(result);

    }else{
        req.getConnection(function (err, connection) {
            connection.query("DELETE FROM CLASS WHERE CRN = ? ",input.crn, function(err, rows){
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
/**
 * add student to a class.
 *      -instructor
 *          -crn
 *          -student
 *      -admin
 *          -crn
 *          -student
 * @param req
 * @param res
 */
exports.addStudent = function(req,res){
    var input = req.query;
    var result = checkPermission(req, 1);

    if(result.error){
        res.send(result);

    }else{
        req.getConnection(function (err, connection) {
            /*
             CREATE TABLE STUDENT(
                 CRN INT(15) NOT NULL,
                 STUDENT INT(15) NOT NULL,
             );
             CREATE TABLE CLASS(
             CRN INT(15) NOT NULL UNIQUE,
             INSTRUCTOR INT(15) NOT NULL,
             CLASSNAME VARCHAR(32),
             );
             */
            //        admin can add student to anyone's class.

            // grep userid first.
            connection.query("SELECT USERNAME,USERID FROM USER WHERE USERNAME = ?", input.student, function(err3,rows3){
                if(err3){
                    result.error= err3;
                    res.send(result);
                }else if(rows3.length!=1) {
                    if(rows3.length==0)
                        result.error = "No User found for :"+input.student;
                    else
                        result.error ="Multiple User found for :"+input.student+". Ask Admin for more detail.";
                    res.send(result);
                }else {
                        var data={
                            CRN:input.crn,
                            STUDENT:rows3[0].USERID  // this is username, not userid,
                        };
                        if(req.user.USERTYPE==0){   //admin
                            connection.query("INSERT INTO STUDENT set ? ",data, function(err, rows){
                                if (err){
                                    result.error=err;
                                }else{
                                    rows.USERID = data.STUDENT;
                                    rows.USERNAME = input.student;
                                    result.data=rows;
                                }
                                res.send(result);

                            });
                        }else{ // instructor]
                            connection.query("SELECT * FROM CLASS WHERE CRN = ?",input.crn,function(err,rows){
                                if(err){
                                    result.error= err;
                                    res.send(result);
                                }else if(rows.length!=1) {
                                    if(rows.length==0)
                                        result.error = "No class found for :"+input.crn;
                                    else
                                        result.error ="Multiple class found for :"+input.crn+". Ask Admin for more detail.";
                                    res.send(result);
                                }else if(rows[0].INSTRUCTOR==req.user.USERID){ // request user own the CRN.
                                    connection.query("INSERT INTO STUDENT set ? ",data, function(err2, rows2){
                                        if (err2){
                                            result.error=err2;
                                        }else{
                                            rows2.USERID = data.STUDENT;
                                            rows2.USERNAME = input.student;
                                            result.data=rows2;
                                        }
                                        res.send(result);
                                    });
                                }else{
                                    result.error="Instructor can only add student to his/her class.";
                                    res.send(result);
                                }

                            });

                        }
                    }

            })



        });
    }
};
/**
 * del a student from class
 *      -instructor
 *          -crn
 *          -student
 *      -admin
 *          -crn
 *          -student
 * @param req
 * @param res
 */
exports.delStudent = function(req,res){
    var input = req.query;
    var result = checkPermission(req, 1);

    if(result.error){
        res.send(result);

    }else{
        req.getConnection(function (err, connection) {
            /*
             CREATE TABLE STUDENT(
             CRN INT(15) NOT NULL,
             STUDENT INT(15) NOT NULL,
             );
             CREATE TABLE CLASS(
             CRN INT(15) NOT NULL UNIQUE,
             INSTRUCTOR INT(15) NOT NULL,
             CLASSNAME VARCHAR(32),
             );
             */
            //        admin can remove student from anyone's class.
            if(req.user.USERTYPE==0){   //admin
                connection.query("DELETE FROM STUDENT WHERE CRN = ? AND STUDENT = ?",[input.crn,input.student], function(err, rows){
                    if (err){
                        result.error=err;
                    }else{
                        result.data=rows;
                    }
                    res.send(result);

                });
            }else{ // instructor]
                connection.query("SELECT * FROM CLASS WHERE CRN = ?",input.crn,function(err,rows){
                    if(err){
                        result.error= err;
                        res.send(result);
                    }else if(rows[0].INSTRUCTOR==req.user.USERID){ // request user own the CRN.
                        connection.query("DELETE FROM STUDENT WHERE CRN = ? AND STUDENT = ?",[input.crn,input.student], function(err, rows){
                            if (err){
                                result.error=err;
                            }else{
                                result.data=rows;
                            }
                            res.send(result);
                        });
                    }else{
                        result.error="Instructor cannot delete student from other instructor's class.";
                        res.send(result);
                    }

                });

            }


        });
    }
};
/**
 * add a record
 *  -all
 *      -instructor
 *      -filename
 *      -timeSpend
 *      -wordRead
 *      -lbRead
 *      -regression
 *      -fixation
 * @param req
 * @param res
 */
exports.addRecord = function(req,res){
    var input = req.query;
    var result = checkPermission(req, 2);

    if(result.error){
        res.send(result);

    }else{
        /*
         CREATE TABLE RECORD(
             USERID INT(15) NOT NULL,
             INSTRUCTOR INT(15) NOT NULL,
             CRN VARCHAR(32) NOT NULL,
             FILENAME VARCHAR(32) NOT NULL,
             STARTTIME BIGINT(20) NOT NULL,
             ENDTIME BIGINT(20) NOT NULL,
             SSPEED INT(4) NOT NULL,
             ESPEED INT(4) NOT NULL,
             TIME_SPENT INT(10) NOT NULL,
             WORD_READ INT(6) NOT NULL,
             LB_READ INT(6) NOT NULL,
             REGRESSION INT(4) NOT NULL,
             FIXATION INT(4) NOT NULL,
             PRIMARY KEY (USERID, CRN, FILENAME,STARTTIME)
         );
         */
        req.getConnection(function (err, connection) {
            var data = {
                USERID: req.user.USERID,
                INSTRUCTOR: input.instructor,
                CRN: input.crn,
                FILENAME: input.filename,
                STARTTIME:input.startTime,
                ENDTIME:input.endTime,
                SSPEED:input.startWpm,
                ESPEED:input.endWpm,
                TIME_SPENT: input.timeSpend,
                WORD_READ: input.wordRead,
                LB_READ: input.lbRead,
                REGRESSION: input.regression,
                FIXATION: input.fixation
            };
            var data2 ={
                TIME_SPENT: input.timeSpend,
                WORD_READ: input.wordRead,
                LB_READ: input.lbRead,
                REGRESSION: input.regression,
                FIXATION: input.fixation,
                ENDTIME:input.endTime,
                SSPEED:input.startWpm,
                ESPEED:input.endWpm
            };
            connection.query("INSERT INTO RECORD set ? ON DUPLICATE KEY UPDATE ?",[data,data2], function(err, rows){
                if (err){
                    logError(err);
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
    var result = checkPermission(req, 2);
    if(result.error){
        res.send(result);
    }else{
        req.getConnection(function (err, connection) {
            if(req.user.USERTYPE==2){
                connection.query("SELECT * FROM (SELECT * FROM RECORD WHERE USERID = ?) AS B " +
                                    "JOIN (SELECT USERID, USERNAME,FNAME,LNAME FROM USER) AS A ON (A.USERID = B.USERID) " +
                                        "JOIN CLASS ON (B.CRN=CLASS.CRN) ",req.user.USERID, function(err, rows){
                    if (err){
                        logError(err);
                        result.error=err;
                    }else{
                        result.data=rows;
                    }
                    res.send(result);

                });
            }else if(req.user.USERTYPE==1 ){
                connection.query("SELECT * FROM (SELECT * FROM RECORD WHERE INSTRUCTOR = ?)AS B " +
                                    "JOIN (SELECT USERID, USERNAME,FNAME,LNAME FROM USER) AS A ON (A.USERID = B.USERID) " +
                                        "JOIN CLASS ON (B.CRN=CLASS.CRN)",[req.user.USERID], function(err, rows){
                    if (err){
                        logError(err);
                        result.error=err;
                    }else{
                        result.data=rows;
                    }
                    res.send(result);

                });
            }else if(req.user.USERTYPE==0){
                connection.query("SELECT * FROM RECORD " +
                                    "JOIN (SELECT USERID, USERNAME,FNAME,LNAME FROM USER) AS A ON (A.USERID = RECORD.USERID) " +
                                        "JOIN CLASS ON (RECORD.CRN=CLASS.CRN)", function(err, rows){
                    if (err){
                        logError(err);
                        result.error=err;
                    }else{
                        result.data=rows;
                    }
                    res.send(result);

                });
            }


        });
    }
};
//GET_FILELIST(USERID);
exports.getFiles = function(req,res){
    var input = req.query;
    var result = checkPermission(req, 2);
    if(result.error){
        res.send(result);
    }else{
        //get class crn, then, find all instructor to this account, then fetch all file from the instructors.
        req.getConnection(function (err, connection) {
            var userid = req.user.userid;

            if(input.crn){ // single class
                if(req.user.USERTYPE==2){
                    hasStudent(connection,input,req.user,res,getFileList);
                }else if(req.user.USERTYPE==1){
                    ownedClass(connection,input,req.user,res,getFileList);
                }else if(req.user.USERTYPE==0){
                    getFileList(connection,input,req.user,res);
                }
            }else{
                if(req.user.USERTYPE==1){ // INSTRUCTOR
                    connection.query('SELECT FILEID, FILENAME,USERID FROM FILE WHERE USERID = ? ',[req.user.USERID],function(err, rows){
                        logAndSend(res,err,rows);
                    });
                }else if(req.user.USERTYPE==0){ // admin get instructor username as well.
                    connection.query('SELECT FILEID,FILENAME ,FILE.USERID,USERNAME FROM FILE ' +
                                        'JOIN USER ON(FILE.USERID = USER.USERID) ORDER BY USERNAME',function(err, rows){
                        logAndSend(res,err,rows);
                    });
                }
            }
        });
    }
};
function logAndSend(res,err,rows,next){
    if (err){
        logError(err);
        res.send({error:err});
    }else
        if(next)
            next();
        else
            res.send({data:rows});
}

function hasStudent(connection,input, user,res,next){
    connection.query("SELECT CRN FROM STUDENT WHERE CRN = ? AND STUDENT = ?",[input.crn,user.USERID],function(err,rows){
        logAndSend(res,err,rows,function(){
            if(rows.length==0)
                res.send({error:'You are not in the class. crn= '+input.crn});
            else
                next(connection, input, user, res);
        })
    });
}

function ownedClass(connection,input, user,res,next){
    connection.query("SELECT CRN FROM CLASS WHERE CRN =? AND INSTRUCTOR = ?",[input.crn,user.USERID],function(err,rows){
        logAndSend(res,err,rows, function(){
            if(rows.length==0)
                res.send({error:'You are not own the class. crn= '+input.crn});
            else
                next(connection, input, user, res);
        })
    });
}

function ownedFile(connection,input, user,res,next){
    connection.query("SELECT FILEID FROM FILE WHERE FILEID =? AND USERID = ?",[input.fileid,user.USERID],function(err,rows){
        logAndSend(res,err,rows, function(){
            if(rows.length==0)
                res.send({error:'You are not own the class. crn= '+input.crn});
            else
                next(connection, input, user, res);
        })
    });
}

function getFileList(connection,input,user,res,next){
    connection.query(
        "SELECT FILEID, FILENAME, USERID FROM FILE WHERE FILEID IN" +
            "( SELECT FILEID FROM FILE_PERMISSION WHERE CRN = ? )"
        ,input.crn, function(err, rows){
            logAndSend(res,err,rows);
        });
}

exports.listUser = function(req,res){
    var input = req.query;
    var result = checkPermission(req, 0);
    if(result.error){
        res.send(result);

    }else{
        req.getConnection(function (err, connection) {

            connection.query("SELECT USERNAME,USERTYPE FROM USER ",
                //"WHERE USERID IN "+
                //	"(SELECT STUDENT FROM STUDENT WHERE CRN IN " +
                //	"(SELECT CRN FROM CLASS WHERE INSTRUCTOR = ? ))" ,INSTRUCTOR,
                function(err, rows){
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

exports.listInstructor = function(req,res){
    var input = req.query;
    var result = checkPermission(req, 2);
    if(result.error){
        res.send(result);

    }else{
        req.getConnection(function (err, connection) {
            if(req.user.USERTYPE==2){
                connection.query("SELECT USERNAME,FNAME,LNAME,USERID FROM USER WHERE USERID IN " +
                    "(SELECT INSTRUCTOR FROM CLASS WHERE CRN IN" +
                    " (SELECT CRN FROM STUDENT WHERE STUDENT = ?))",req.user.USERID, //instructor or admin
                    function(err, rows){
                        if (err){
                            logError(err);
                            result.error=err;
                        }else{
                            result.data=rows;
                        }
                        res.send(result);

                    });
            }else if(req.user.USERTYPE==1){
                connection.query("SELECT USERNAME,FNAME,LNAME,USERID FROM USER WHERE USERID = ?",req.user.USERID, //instructor or admin
                    function(err, rows){
                        if (err){
                            logError(err);
                            result.error=err;
                        }else{
                            result.data=rows;
                        }
                        res.send(result);

                    });
            }else{
                connection.query("SELECT USERNAME,FNAME,LNAME,USERID FROM USER WHERE USERTYPE = 1", //instructor or admin
                    function(err, rows){
                        if (err){
                            logError(err);
                            result.error=err;
                        }else{
                            result.data=rows;
                        }
                        res.send(result);

                    });
            }


        });
    }
};



//-- list student
exports.listStudent = function(req,res){
    var input = req.query;
    var result = checkPermission(req, 1);
    if(result.error){
        res.send(result);

    }else{
        req.getConnection(function (err, connection) {
            if(req.user.USERTYPE==1){ //INSTRUCTOR
                connection.query("SELECT * FROM CLASS WHERE CRN = ? AND INSTRUCTOR = ?",
                    [input.crn,req.user.USERID],function(err,rows){
                        if(err){
                            logError(err);
                            result.error=err;
                            res.send(result);
                        }else if(rows.length==0){
                            result.error='You do not have access to this class.';
                            console.log('WARNING: attempt to access crn: '+input.crn+' from user '+req.user.USERNAME);
                            res.send(result);
                        }else{
                            connection.query(
                                "SELECT * FROM USER JOIN " +
                                "(SELECT STUDENT FROM STUDENT WHERE CRN = ?) AS B " +
                                "ON (USER.USERID= B.STUDENT)"
                                ,input.crn, function(err, rows){
                                    if (err){
                                        logError(err);
                                        result.error=err;
                                    }else{
                                        result.data=rows;
                                    }
                                    res.send(result);

                                });
                        }
                    })

            }else{
                connection.query(
                    "SELECT USERNAME,USERID FROM USER JOIN " +
                    "(SELECT STUDENT FROM STUDENT WHERE CRN = ?) AS B " +
                    "ON (USER.USERID= B.STUDENT)"
                    ,input.crn, function(err, rows){
                        if (err){
                            logError(err);
                            result.error=err;
                        }else{
                            result.data=rows;
                        }
                        res.send(result);

                    });
            }



        });
    }
};

exports.getPermission= function(req,res){
    var input = req.query;
    var result = checkPermission(req, 1);
    if(result.error){
        res.send(result);
    }else{
        req.getConnection(function (err, connection) {
            var instructor = req.user.USERID;
            if(req.user.USERTYPE==0&&input.instructor)
                instructor= input.instructor;
            if(input.fileid){
                connection.query("SELECT FILE.FILEID,FILE.FILENAME, CLASS.CRN,CLASS.CLASSNAME FROM " +
                    "(" +
                    "(SELECT FILEID, FILENAME, USERID FROM FILE WHERE FILEID = ? AND USERID = ?) AS FILE" +
                    " JOIN FILE_PERMISSION ON (FILE.FILEID = FILE_PERMISSION.FILEID) " +
                    "RIGHT JOIN " +
                    "(SELECT * FROM CLASS WHERE INSTRUCTOR = ?) AS CLASS" +
                    " ON (CLASS.CRN = FILE_PERMISSION.CRN))"
                    ,[input.fileid,instructor,instructor],function(err,rows){
                        logAndSend(res,err,rows);
                    });
            }else{
                connection.query("SELECT FILE.FILEID,FILE.FILENAME, CLASS.CRN,CLASS.CLASSNAME FROM " +
                    "(" +
                    "(SELECT * FROM CLASS WHERE INSTRUCTOR = ? AND CRN = ?) AS CLASS " +
                    "JOIN FILE_PERMISSION ON (CLASS.CRN = FILE_PERMISSION.CRN) " +
                    " RIGHT JOIN (SELECT FILEID, FILENAME, USERID FROM FILE WHERE USERID = ?) AS FILE" +
                    " ON (FILE.FILEID = FILE_PERMISSION.FILEID))"
                    ,[instructor,input.crn,instructor],function(err,rows){
                        logAndSend(res,err,rows);
                    });
            }

        });
    }
};
exports.changePermission= function(req,res){
    var input = req.query;
    var result = checkPermission(req, 1);
    if(result.error){
        res.send(result);
    }else{
        req.getConnection(function (err, connection) {
            if(req.user.USERTYPE==1){
                ownedFile(connection,input,req.user,res,function(){
                    ownedClass(connection,input,req.user,res,modifyFilePermission);
                })
            }else{
                modifyFilePermission(connection,input,req.user,res);
            }
        });
    }
};

function modifyFilePermission(connection,input,user,res,next){
    if(input.del){
        console.log('del');
        connection.query("DELETE FROM FILE_PERMISSION WHERE FILEID = ? AND CRN = ?",[input.fileid,input.crn],
            function(err,rows){
                logAndSend(res,err,'ok');
            });
    }else{
        var data = {
            FILEID:input.fileid,
            CRN:input.crn
        };
        connection.query("INSERT INTO FILE_PERMISSION SET ?",data,
            function(err,rows){
                logAndSend(res,err,'ok');
            });
    }
}

exports.listClassOwn = function(req,res){
    var input = req.query;
    var result = checkPermission(req, 1);
    if(result.error){
        res.send(result);

    }else{
        req.getConnection(function (err, connection) {
           if (req.user.USERTYPE ==1){
                connection.query("SELECT * FROM CLASS WHERE INSTRUCTOR = ?",[req.user.USERID], function(err, rows){
                    if (err){
                        logError(err);
                        result.error=err;
                    }else{
                        result.data=rows;
                    }
                    res.send(result);
                });
            }else if(req.user.USERTYPE==0){
                connection.query("SELECT * FROM CLASS WHERE INSTRUCTOR = ?",input.instructor, function(err, rows){
                    if (err){
                        logError(err);

                        result.error=err;
                    }else{
                        result.data=rows;
                    }
                    res.send(result);
                });
            }
        });
    }
};

//-- list class that belong to instructor USERID
exports.listClass = function(req,res){
    var input = req.query;
    var result = checkPermission(req, 2);
    if(result.error){
        res.send(result);

    }else{
        req.getConnection(function (err, connection) {
            if(req.user.USERTYPE==2){// student
                console.log('student: '+req.user.USERID);
                connection.query("SELECT * FROM CLASS WHERE CRN IN " +
                "(SELECT CRN FROM STUDENT WHERE STUDENT = ?)",req.user.USERID, function (err, rows) {
                    if(err)
                        result.error = err;
                    else
                        result.data = rows;
                    res.send(result);
                });

            }else if (req.user.USERTYPE ==1){
                connection.query("SELECT * FROM CLASS WHERE INSTRUCTOR = ? OR CRN IN " +
                "(SELECT CRN FROM STUDENT WHERE STUDENT = ?)" ,[req.user.USERID,req.user.USERID], function(err, rows){
                    if (err){
                        result.error=err;
                    }else{
                        result.data=rows;
                    }
                    res.send(result);
                });
            }else if(req.user.USERTYPE==0){
                connection.query("SELECT * FROM CLASS", function(err, rows){
                    if (err){
                        result.error=err;
                    }else{
                        result.data=rows;
                    }
                    res.send(result);
                });
            }
        });
    }
};

//-- login ----student   	-- getListFile   done
//-- getReport    done
//
//----Instructor -- add student done
//-- add class  done
//-- add file done
//-- list class
//-- list student
//-- list file      done
//-- remove file   done
//-- remove student  done
//-- remove class   done
//-- get student report
//-- add exception    done
//-- remove exception    done
//-- list exception by frequency    done
//
//
//
//
function logError(error){
    console.log(error);
    if(error.stack)
        console.log(error.stack);
}