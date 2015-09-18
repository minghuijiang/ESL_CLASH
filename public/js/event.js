/**
 * Created by MingJiang on 4/16/2015.
 */

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

function createOption(text, val){
    var option = document.createElement('option');
    option.text =text;
    if(val)
        option.value = val;
    return option;
}

function makeEl(type){
    return document.createElement(type);
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
        changeContent(file[instructor][filename],filename);
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
                    changeContent(str,filename);
                }catch(e){
                    console.log(e);
                    document.getElementById("content").innerHTML ='Error parsing the document: '+filename;
                }
            }
        });
    }
});

$('#open').click(function(){
    $('#hiddenFile').trigger('click');
});
$('#hiddenFile').change(function(ev){
    console.log('changed');
    if(this.disabled){
        // do upload and re-download
        return alert('File upload not supported!');

    }else{
        var F = this.files;
        console.log(F);
        var reader = new FileReader();
        console.log(reader);
            reader.onload=function(e){
                var text = this.result;
                console.log(json);
                json = JSON.parse(text);
                var str = parseJSON(json);
                changeContent(str,F[0].name.split('.')[0]);
                $('#hiddenFile').val('');
            };
            reader.readAsText(F[0]);



    }

});

$('#changeName').on('submit',function(ev){
    ev.preventDefault();
    $.get('api/changeName?'+$('#changeName').serialize(),function(data){
        if(data.error)
            onError(data);
        else{
            $('#changeName')[0].reset();
            showMessage("Name Changed");
        }
    })
});
$('#changePassword').on('submit',function(ev){
    ev.preventDefault();
    if($(this)[0][1].value!=$(this)[0][2].value){
        $(this)[0][1].value='';
        $(this)[0][2].value='';
        showError("These passwords don't match, try again.");
        return ;
    }
    var old=$(this)[0][0].value;
    var newPass=$(this)[0][1].value;

    $.get('api/changePassword?oldPass='+old+'&password='+newPass,function(data){
        if(data.error)
            onError(data);
        else{
            showMessage("Password Changed");
        }
        $('#changePassword')[0].reset();
    })
});

//print button
$('#print').bind('click', function () {
    var printContents = $(".printable").html();
    createPrint(printContents);
});

$('#reloadRecord').on('click',function(ev){
    $.get('api/getRecord',function(data){
        var select= $('#recordDisplay');
        console.log(data);
        if(data.error){
            showError(data.error);
        }else{
            recordData=data.data;
            $.get('/api/listInstructor',function(data){
                if(data.error)
                    onError(data);
                else{
                    resetSelect('selectIns',createOption('All Instructor','all'));
                    var v = data.data;
                    for(var i=0;i< v.length;i++){
                        var name;
                        if(v[i].FNAME)
                            name = v[i].FNAME+' '+v[i].LNAME;
                        else
                            name = v[i].USERNAME;
                        $('#selectIns').append(createOption(name,v[i].USERID));
                    }
                }
            });
            $.get('/api/listClass',function(data){
                if(data.error)
                    onError(data);
                else{
                    resetSelect('clsSelector',createOption('All Class','all'));
                    var v = data.data;
                    for(var i=0;i< v.length;i++){
                        $('#clsSelector').append(createOption(v[i].CLASSNAME,v[i].CRN));
                    }
                }
            } );
            filterRecord();

        }
    });
});

$('#selectIns').change(function(ev){
    ins=$(this).find('option:selected').val();
    filterRecord();
});

$('#clsSelector').change(function(ev){
    classcrn = $(this).find('option:selected').val();
    filterRecord();
});


$( "#main-tabs" ).tabs();
$("li.last a").unbind('click');
$( "#manageTabs" ).tabs();
$("button").button();

