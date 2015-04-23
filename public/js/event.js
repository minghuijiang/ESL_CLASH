/**
 * Created by MingJiang on 4/16/2015.
 */


function createOption(text, val){
    var option = document.createElement('option');
    option.text =text;
    if(val)
        option.value = val;
    return option;
}

function createPrint(content){
    var myWindow = window.open("", "_newtab", "");
    var doc = myWindow.document;
    doc.write("<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Transitional//EN\" \"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd\">");
    doc.write('<html><head><link rel="stylesheet" href="css/main-style.css"></head><body>');
    doc.write('<div class="hide" style="margin-left: auto;margin-right: auto;width: 9em;">' +
        '<input  type="button" value="print this page" style ="' +
        'font-size:1.2em;font-family: sans-serif" onclick="window.print()" /></div>'
    );
    doc.write(content);
    doc.write("</body></html>");
}


// reload class in read page
$('#reloadReadClass').on('click',function(){
    $.get('api/listClass?',function(data){
        var select= $('#classSelector');
        console.log(data);
        if(data.error){
            showError(data.error);
        }else{
            var o = createOption('Select a class');
            o.disabled = 'disabled';
            o.selected ='selected';
            select.text('');
            select.append(o);

            for(var i=0;i<data.data.length;i++){
                var obj = data.data[i];
                var option = createOption(obj.CLASSNAME,obj.CRN);
                select.append(option);
            }
        }
    })
});


// class selection change event.
$('#classSelector').change(function(ev){
    var crn = this.options[this.selectedIndex].value;
    $.get('api/getFiles?crn='+crn,function(data){
        var select= $('#fileSelector');
        console.log(data);
        if(data.error){
            showError(data.error);
        }else{
            var o = createOption('Select a File');
            o.disabled = 'disabled';
            o.selected ='selected';
            select.text('');
            select.append(o);
            for(var i=0;i<data.data.length;i++){
                var option = createOption(data.data[i].FILENAME,data.data[i].USERID);
                select.append(option);
            }
        }
    })
});

// file selection change event
$('#fileSelector').change(function(ev){
    var select = $('#classSelector')[0];
    var crn = select.options[select.selectedIndex].value;
    var instructor = this.options[this.selectedIndex].value;
    var filename = this.options[this.selectedIndex].innerHTML;
    if(file[instructor]&&file[instructor][filename]){  // if cache exist
        changeContent(file[instructor][filename]);
    }else {
        $.get('api/getFile?crn=' + crn + '&filename=' + filename+'&userid='+instructor, function (data) {
            console.log(data);
            if (data.error)
                showError(data.error);
            else {
                try {
                    json = JSON.parse(data.data[0].JSON);
                    var str = parseJSON(json);
                    addTofile(data.data[0].FILENAME, data.data[0].USERID, str);
                    changeContent(str);
                }catch(e){
                    console.log(e);
                    document.getElementById("content").innerHTML ='Error parsing the document: '+filename;
                }
            }
        });
    }
});

//print button
$('#print').bind('click', function () {
    var printContents = $(".printable")[0].html();
    createPrint(printContents);
});