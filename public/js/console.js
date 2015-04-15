/**
 * Created by MingJiang on 4/16/2015.
 *
 * manage message display
 */
var multiMessage = false; //if multiple message is allowed. for batch process.
var message = "#message" // where to put message
function showMessage(msg){
    if(!multiMessage)
        clearMessage();
    $(message).append('<div>'+msg+'</div>');
}

function showError(err){
    if(!multiMessage)
        clearMessage();
    $(message).append('<div style="color:red;">'+msg+'</div>');

}


function turnonMultiMsg(isMulti){
    multiMessage=isMulti;
    if(!multiMessage){// turn off.
        runClean(10000);  // clear message after 5 second.
    }
}

function runClean(time){
    setTimeout(clearMessage,time);  // clear message after 5 second.
}
function clearMessage(){
    $(message).text('');
}