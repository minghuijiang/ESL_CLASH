/**
 * Created by MingJiang on 4/16/2015.
 *
 * manage message display
 */
var multiMessage = false; //if multiple message is allowed. for batch process.
var message = "#message" // where to put message
function showMessage(msg){
    $(message).append('<div>'+msg+'</div>');
    runClean(3000);
}

function showError(err){
    $(message).append('<div style="color:red;">'+err+'</div>');
    runClean(3000);
}

function runClean(time){
    setTimeout(clearMessage,time);  // clear message after 5 second.
}
function clearMessage(){
    $(message)[0].remove();
}