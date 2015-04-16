/**
 * Created by Ming on 4/8/2015 0008.
 */

function addUser(form,callback, field){
    console.log(form);
    registerSubmit(form,'api/addUser?',callback, field);
}
function delUser(form,callback, field){
    registerSubmit(form,'api/delUser?',callback, field);
}
function addFile(form,callback, field){
    registerSubmit(form,'api/addFile?',callback, field);
}
function delFile(form,callback, field){
    registerSubmit(form,'api/delFile?',callback, field);
}
function addException(form,callback, field){
    registerSubmit(form,'api/addException?',callback, field);
}
function delException(form,callback, field){
    registerSubmit(form,'api/delException?',callback, field);
}
function printException(form,callback, field){
    registerSubmit(form,'api/printException?',callback, field);
}
function addClass(form,callback, field){
    registerSubmit(form,'api/addClass?',callback, field);
}
function delClass(form,callback, field){
    registerSubmit(form,'api/delClass?',callback, field);
}
function addStudent(form,callback, field){
    registerSubmit(form,'api/addStudent?',callback, field);
}
function delStudent(form,callback, field){
    registerSubmit(form,'api/delStudent?',callback, field);
}
function addRecord(form,callback, field){
    registerSubmit(form,'api/addRecord?',callback, field);
}
function getRecord(form,callback, field){
    registerSubmit(form,'api/getRecord?',callback, field);
}
function getFiles(form,callback, field){
    registerSubmit(form,'api/getFiles?',callback, field);
}

function getUser(button,callback, field){
    registerSubmit(button,'api/listUser?',callback, field);
}

function call(url,callback){
    $.get(url,callback);
}

function deleteUser(username,callback){
    call('api/delUser?username='+username,callback);
}

function registerSubmit(form, url, callback,field){
    var obj = $(form);
    if(obj.is('form'))
        obj.on('submit',function(ev){
            ev.preventDefault();
            $.get(url + obj.serialize(),callback);
        });
    else if(obj.is('button')){
        console.log('is button')
        obj.on('click',function(ev){
            ev.preventDefault();
            if(field){
                if($(field).val().length>0)
                    $.get(url + $(field).serialize(),callback);

            }
            else{
                $.get(url ,callback); // no parameter
            }
        });
    }else{
        console.log('unknown object type: ');
        console.log(obj);
    }
}