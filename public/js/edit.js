/**
 * Created by Ming on 3/26/2015 0026.
 */
$(function(){
    $.contextMenu({
        selector: '.word',
        callback: function(key, options) {
            var m = "global: " + key;
            window.console && console.log(m) || alert(m);
        },
        items: {
            "edit": {
                name: "Edit",
                icon: "edit",
                // superseeds "global" callback
                callback: function(key, options) {
                    var m = "edit was clicked";
                    window.console && console.log(m) || alert(m);
                }
            },
            "cut": {name: "Cut", icon: "cut"},
            "copy": {name: "Copy", icon: "copy"},
            "paste": {name: "Paste", icon: "paste"},
            "delete": {name: "Delete", icon: "delete"},
            "sep1": "---------",
            "quit": {name: "Quit", icon: "quit"}
        }
    });
});