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