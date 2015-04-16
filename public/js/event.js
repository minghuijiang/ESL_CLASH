/**
 * Created by MingJiang on 4/16/2015.
 */

function registerDel(leftPane,leftButton, rightPane, rightButton){
        $("#"+leftButton).click(function () {
            var selectedItem = $("#"+rightPane+" option:selected");
            $("#"+leftPane).append(selectedItem);
        });

        $("#"+rightButton).click(function () {
            var selectedItem = $("#"+leftPane+" option:selected");
            $("#"+rightPane).append(selectedItem);
        });
}

function bindLoad(button, panel, url,callback){
    $('#'+button).on('click',function(){
        $.get(url,function(data){
            var select= $('#'+panel);
            select.text('');
            console.log(data);
            if(data.error){
                showError(data.error);
            }else{
                for(var i=0;i<data.data.length;i++){
                    var option = document.createElement('option');
                    option.text =callback(data.data[i]);
                    select.append(option);
                }
            }
        })
    })
}

function bindDel(button,panel,url,processItem,callback){
    $('#'+button).on('click',function(){
        var selectedItem = $("#"+panel)[0];
        for(var i= 0;i<selectedItem.length;i++){
            var text = processItem(selectedItem[i]);
            $.get(url+text,callback);
        }
    })
}

function removeParen(item){
    return item.innerHTML.split('(')[0];
}

function onError(data){
    if(data.error)
        if(data.error.code)
            showError(data.error.code);
        else
            showError(data.error);

}