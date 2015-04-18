/**
 * Created by MingJiang on 4/18/2015.
 * keep data mapping.
 */

var classes= {

};

var file ={

};

var user = {

};

function addToClass(className,instructor, crn){
    classes[instructor][className]=crn;
}

function addTofile(filename,instructor,json){
    file[instructor][filename]=json;
}

function addToUser(username, userid){
    user[username]=userid;
}