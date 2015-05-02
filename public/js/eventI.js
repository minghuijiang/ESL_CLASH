/**
 * Created by MingJiang on 4/24/2015.
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
            console.log(data);
            if(data.error){
                showError(data.error);
            }else{
                select.text('');
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
        $("#"+panel).text('');
    })
}


function instructorBinding(){
    //delete script
    registerDel('leftException','exceptionLeftButton','rightException','exceptionRightButton');
    registerDel('leftFile','fileLeftButton','rightFile','fileRightButton');
    registerDel('leftStudent','studentLeftButton','rightStudent','studentRightButton');

    addUser("#addUser",function(data){
        if(data.error)
            showError('Error: '+data.error.code);
        else{
            showMessage('Account created!');
        }
        console.log(data);
    });
    addClass("#addClass",function(data){
        if(data.error)
            showError('Error: '+data.error.code);
        else{
            showMessage('Class created!');
        }
    });

    $('#button').click(function(){
        console.log('clicked');
        var txt= $('#resizable').val().trim();
        if(txt.length==0){
            showError('Please enter some text before Slash.');
            return ;
        }
        $(this).prop('disabled',true);
        $("span", this).text("This should not take long. Please wait...");
        $.ajax({
            type: "POST",
            url: "/slash",
            data: 'text='+txt,
            success: function(data){
                $("#button").prop('disabled',false);
                $("#button span").text("SLASH IT!");
                if(data.error){
                    onError(data);
                }else{
                    $('#resizable').val('');
                    json = JSON.parse(data.data);
                    var str =parseJSON(json);
                    changeContent(str,'');
                    $( "#main-tabs" ).tabs( "option", "active", 0 );
                }

            }
        });
    });

    $('#uploadFile').on('submit',function(ev){
        ev.preventDefault();
        var filename = $('#fileInput')[0]['files'][0]['name'];
        var formData = new FormData($('#uploadFile')[0]);
        $('#fileSubmit',this).prop('disabled',true);
        $('#fileSubmit',this).val('Please wait...');
        $.ajax({
            url: '/uploads',
            type: 'POST',
            success: function(data){
                $('#fileSubmit').prop('disabled',false);
                $('#fileSubmit').val('Submit');
                console.log(data);
                if(data.error)
                    onError(data);
                else{
                    json = JSON.parse(data.data);
                    var str =parseJSON(json);
                    changeContent(str,filename);
                    $( "#main-tabs" ).tabs( "option", "active", 0 );
                    $('#uploadFile').each(function(){
                        this.reset();
                    });
                }
            },
            error: function(data){
                console.log(data);
                onError(data);
            },
            // Form data
            data: formData,
            //Options to tell jQuery not to process data or worry about content-type.
            cache: false,
            contentType: false,
            processData: false
        });

    });
    $('#saveFile').on('click',function(){
        var name = $('#filename').val().trim();
        if(name.length==0){
            alert('Please enter a valid filename.');
            return ;
        }
        $.get('api/checkFile?filename='+name,function(data){
            console.log(data.data);
           if(data.error)
                onError(data);
            else{
               var canSave = data.data;
               var accept=false;
               if(!canSave){
                   accept = confirm('Filename: '+name+' exist, do you want to overwrite the file?');
                   if(!accept)
                        return;
               }
                   var contents = JSON.stringify(json);
                   $.post('api/addFile',{filename: name,contents:contents,overwrite:accept},function(data){
                       console.log(data);
                       if(data.error){
                           if(data.error.code=='ER_DUP_ENTRY'){
                               showError('File Exist');
                           }else{
                               onError(data);
                           }
                       } else{
                           console.log(parseJSON(json));
                           addTofile(name,data.data.USERID,parseJSON(json));
                           if(!accept){
                               //$('#filename').val('');
                               $('#fileSelector').append(createOption(name,data.data.USERID));
                               showMessage('File Saved as "'+name+'"');

                           }else{
                               showMessage('File overwritten as "'+name+'"');
                           }
                       }
                   })
           }
        });

    });



    bindLoad('reloadUser','leftUser','api/listUser?',function(obj){
        return obj.USERNAME +'('+(obj.USERTYPE==2?'S':obj.USERTYPE==1?'I':'A')+')';
    });

    bindLoad('reloadClass2','leftClass2','api/listClass?',function(obj){
        return obj.CRN+'-'+obj.CLASSNAME;
    });
    $('#leftClass2').on('change',function(ev){
        var crn =ev.currentTarget.options[ev.currentTarget.selectedIndex].innerHTML.split('-')[0];
        $.get('api/listStudent?crn='+crn,function(data){
            var select= $('#leftStudent');
            var right = $('#rightStudent');
            console.log(data);
            if(data.error){
                showError(data.error);
            }else{
                select.text('');
                right.text('');
                for(var i=0;i<data.data.length;i++){
                    var option = createOption(data.data[i].USERNAME);
                    addToUser(data.data[i].USERNAME,data.data[i].USERID);
                    select.append(option);
                }
            }
        });
    });

    $('#addStudentToClass').on('click',function(ev){
        var raw = $('#studentField').val();
        var students =raw.split(',');
        var selected  = $('#leftClass2 option:selected')[0];
        if(!selected){
            alert('Please select a class before add student.');
        }
        var crn = selected.innerHTML.split("-")[0];
        for(var i=0;i<students.length;i++)
            $.get('api/addStudent?student='+students[i]+'&crn='+crn,function(data){
                if(data.error)
                    onError(data);
                else{
                    console.log(data);
                    var result = data.data;
                    var option = createOption(result.USERNAME);
                    addToUser(result.USERNAME,result.USERID);
                    $('#leftStudent').append(option);
                }
            });
    });

    bindLoad('reloadFile','leftFile','api/getFiles?',function(obj){
        if(obj.USERNAME)
            return obj.FILENAME+'('+obj.USERNAME+')';
        return obj.FILENAME;
    });

    bindLoad('reloadException','leftException','api/printException?',function(obj){
        return obj.EX_STR+'('+obj.COUNT+')';
    });

    bindDel('submitDeleteUser','rightUser','api/delUser?username=',removeParen,onError);
    bindDel('submitDeleteException','rightException','api/delException?exception=',removeParen,onError);
    bindDel('submitDeleteFile','rightFile','api/delFile?filename=',function(item){
        var split = item.innerHTML.split('(');
        if(split.length==1)
            return split[0];
        else
            return split[0]+'&username='+split[1].split(')')[0];
    },onError);
    bindDel('submitDeleteStudent','rightStudent','api/delStudent?student=',function(item){
        var studentid = user[item.innerHTML];
        var crn = $('#leftClass2 option:selected')[0].innerHTML.split("-")[0];
        console.log('delete student '+studentid+' from '+ crn);
        return studentid+'&crn='+crn;
    },onError);


    addException('#addEx',function(data){
        if(data.error)
            showError(data.error);
        else{
            showMessage('Exception Added.');
            $('#newException').val('');
        }
    },$('#newException'));


}

instructorBinding();
$( "#main-tabs" ).tabs( "option", "active", 2 );
