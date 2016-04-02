/**
 * Created by ming on 4/2/2016.
 *
 * This file in conjunction with Database.js are
 * intend to replace old DB.js,
 *
 * This file contain necessary functions to carry out all functionality.
 */


function checkUserName(req,res,callback){
    var result = callback?req.result:{};
    var func = callback?callback:req.send;
    connection.query("SELECT USERID FROM USER WHERE USERNAME = ?",req.query.username,function(err, rows){
        if(err){
            logError(err);
            result.error = err;
            func(result);
        }else if(rows.length!=0){
            result.error = "User exist.";
            func(result);
        }
    })
}

function addUser(req,res,callback){
    var input = req.query;
    var result = checkPermission(req, 1);
    var usertype = input.usertype|| 2; // default account with student privilege.
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
                            res.send(result);
                        }else{
                            result.data=rows;
                        }

                    });
                }
            })



        });
    }

}