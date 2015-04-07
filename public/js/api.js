/**
 * Created by Ming on 4/8/2015 0008.
 */

function addUser(form, callback){
    registerSubmit(form,'api/addUser?',callback);
}
function delUser(form, callback){
    registerSubmit(form,'api/delUser?',callback);
}
function addFile(form, callback){
    registerSubmit(form,'api/addFile?',callback);
}
function delFile(form, callback){
    registerSubmit(form,'api/delFile?',callback);
}
function addException(form, callback){
    registerSubmit(form,'api/addException?',callback);
}
function delException(form, callback){
    registerSubmit(form,'api/delException?',callback);
}
function printException(form, callback){
    registerSubmit(form,'api/printException?',callback);
}
function addClass(form, callback){
    registerSubmit(form,'api/addClass?',callback);
}
function delClass(form, callback){
    registerSubmit(form,'api/delClass?',callback);
}
function addStudent(form, callback){
    registerSubmit(form,'api/addStudent?',callback);
}
function delStudent(form, callback){
    registerSubmit(form,'api/delStudent?',callback);
}
function addRecord(form, callback){
    registerSubmit(form,'api/addRecord?',callback);
}
function getRecord(form, callback){
    registerSubmit(form,'api/getRecord?',callback);
}
function getFiles(form, callback){
    registerSubmit(form,'api/getFiles?',callback);
}

function registerSubmit(obj, url, callback){
    if(obj.is('form'))
        obj.on('submit',function(ev){
            ev.preventDefault();
            $.get(url + obj.serialize(),callback);
        });
    else if(obj.is('button')){
        obj.on('click',function(ev){
            ev.preventDefault();
            $.get(url + obj.serialize(),callback);
        });
    }else{
        console.log('unknown object type: ');
        console.log(obj);
    }
}