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
    if(input.usertype!=2&&req.user.USERTYPE==1){
        result.error="Instructor can only create student account";
    }
    if(result.error){
        res.send(result);

    }else{

        req.getConnection(function (err, connection) {
            var data = {
                USERNAME    : input.username,
                PASSWORD : input.password,
                USERTYPE   : usertype
            };

            //TODO verify if username already exist before do a insert,
            // not necessary for prototype
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
//UPDATE_EXCEPTION    -- should be called from java program,  TODO
exports.updateException = function(req,res){
    var input = req.query;
    var result = checkPermission(req, 1);
    if(req.user.USERTYPE==1&&input.usertype!=2){
        result.error="Instructor cannot create account other than student.";
    }
    if(result.error){
        res.send(result);

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
            connection.query("SELECT * FROM EXCEPTION WHERE USERID = ? ORDER BY COUNT",req.user.USERID, function(err, rows){
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
            var data={
                CRN:input.crn,
                STUDENT:input.student
            };
            if(req.user.USERTYPE==0){   //admin
                connection.query("INSERT INTO STUDENT set ? ",data, function(err, rows){
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
                    }else if(rows[1].INSTRUCTOR==req.user.USERID){ // request user own the CRN.
                        connection.query("INSERT INTO STUDENT set ? ",data, function(err, rows){
                            if (err){
                                result.error=err;
                            }else{
                                result.data=rows;
                            }
                            res.send(result);
                        });
                    }else{
                        result.error="Instructor can only add student to own class.";
                        res.send(result);
                    }

                });

            }


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
                connection.query("DELETE FROM STUDENT WHERE CRN = ? AND STUDENT = ?",[input.crn,input,student], function(err, rows){
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
                    }else if(rows[1].INSTRUCTOR==req.user.USERID){ // request user own the CRN.
                        connection.query("DELETE FROM STUDENT WHERE CRN = ? AND STUDENT = ?",[input.crn,input,student], function(err, rows){
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
             INSTRUCTORID INT(15) NOT NULL,
             FILENAME VARCHAR(32) NOT NULL,
             TIME_SPENT_SEC INTEGER NOT NULL,
             WORD_READ INT NOT NULL,
             LB_READ INT NOT NULL,
             REGRESSION INT NOT NULL,
             FIXATION INT NOT NULL
         );
         */
        req.getConnection(function (err, connection) {
            var data = {
                USERID: req.user.USERID,
                INSTRUCTORID: input.instructor,
                FILENAME: input.filename,
                TIME_SPENT_SEC: input.timeSpend,
                WORD_READ: input.wordRead,
                LB_READ: input.lbRead,
                REGRESSION: input.regression,
                FIXATION: input.fixation
            };
            connection.query("INSERT INTO RECORD set ? ",data, function(err, rows){
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
    var result = checkPermission(req, 2);
    if(result.error){
        res.send(result);

    }else{
        req.getConnection(function (err, connection) {
            connection.query("SELECT FROM RECORD WHERE USERID = ? ",req.user.USERID, function(err, rows){
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


            if(req.user.USERTYPE==2){// STUDENT
                //TODO not sure if nested query work, if not, split to three queries.
                connection.query("SELECT FILENAME,CLASS.CLASSNAME FROM FILE JOIN CLASS ON(FILE.USERID=CLASS.INSTRUCTOR)" +
                    "WHERE CLASS.CRN IN " +
                    "(SELECT CRN FROM STUDENT WHERE STUDENT = ?)"
                    ,req.user.USERID, function(err, rows){
                        if (err){
                            console.log(err);
                            result.error=err;
                        }else{
                            result.data=rows;
                        }
                        res.send(result);

                    });
            }else if(req.user.USERTYPE==1){ // INSTRUCTOR
                connection.query('SELECT FILENAME FROM FILE WHERE USERID = ?',req.user.USERID,function(err, rows){
                    if (err){
                        console.log(err);
                        result.error=err;
                    }else{
                        result.data=rows;
                    }
                    res.send(result);

                });
            }else if(req.user.USERTYPE==0){ // admin
                connection.query('SELECT FILENAME ,USERNAME FROM FILE ' +
                '                   JOIN USER ON(FILE.USERID = USER.USERID) ORDER BY USERNAME',function(err, rows){
                    if (err){
                        console.log(err);
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



//-- list student
exports.listStudent = function(req,res){
    var input = req.query;
    var result = checkPermission(req, 1);
    if(result.error){
        res.send(result);

    }else{
        req.getConnection(function (err, connection) {
            //TODO  limit instructor privilege
            connection.query("SELECT USERNAME,USERID FROM USER JOIN " +
                            "（SELECT STUDENT FROM STUDENT WHERE CRN = ?) AS B " +
                                "ON(USER.USERID= B.STUDENT)" ,input.crn, function(err, rows){
                if (err){
                    console.log(err);
                    result.error=err;
                }else{
                    result.data=rows;
                }
                res.send(result);

            });
            console.log(connection);

        });
    }
};


//-- list class that belong to instructor USERID
exports.listClass = function(req,res){
    var input = req.query;
    var result = checkPermission(req, 1);
    if(result.error){
        res.send(result);

    }else{
        req.getConnection(function (err, connection) {
            var instructor = req.user.USERID;
            if(req.user.USERTYPE==0){
                if(input.instructor){
                    instructor= input.instructor;
                }
            }
            connection.query("SELECT * FROM CLASS WHERE INSTRUCTOR = ?" ,instructor, function(err, rows){
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