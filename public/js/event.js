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
    $('#'+button).onclick(function(){
        $.get(url,function(data){
            var select= $('#'+panel);
            select.text('');
            for(var i=0;i<data.data.length;i++){
                var option = document.createElement('option');
                option.text =callback(data.data[i]);
                select.append(option);
            }
        })
    })
}