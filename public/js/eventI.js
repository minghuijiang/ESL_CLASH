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
                    var info = callback(data.data[i]);
                    option.text =info[0];
                    if(info.length==2)
                        option.value=info[1];
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
    //registerDel('leftFile','fileLeftButton','rightFile','fileRightButton');
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
            txt= $('#resizable').attr('placeholder');
            console.log(txt);
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
        return [obj.USERNAME +'('+(obj.USERTYPE==2?'S':obj.USERTYPE==1?'I':'A')+')',obj.USERID];
    });

    bindLoad('reloadClass2','leftClass2','api/listClass?',function(obj){
        return [obj.CLASSNAME,obj.CRN];
    });
    $('#leftClass2').on('change',function(ev){
        var crn =$(this).find(':selected')[0].value;
        console.log(crn);
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
        var crn = selected.value;
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

    //bindLoad('reloadFile','leftFile','api/getFiles?',function(obj){
    //    if(obj.USERNAME)
    //        return [obj.FILENAME+'('+obj.USERNAME+')',obj.FILEID];
    //    return [obj.FILENAME,obj.FILEID];
    //});

    bindLoad('reloadException','leftException','api/printException?',function(obj){
        return [obj.EX_STR+'('+obj.COUNT+')'];
    });

    bindDel('submitDeleteUser','rightUser','api/delUser?username=',removeParen,onError);
    bindDel('submitDeleteException','rightException','api/delException?exception=',removeParen,onError);
    bindDel('submitDeleteStudent','rightStudent','api/delStudent?student=',function(item){
        var studentid = user[item.innerHTML];
        var crn = $('#leftClass2 option:selected')[0].value;
        console.log('delete student '+studentid+' from '+ crn);
        return studentid+'&crn='+crn;
    },onError);


    addException('#addEx',function(data){
        if(data.error)
            onError(data);
        else{
            showMessage('Exception Added.');
            $('#newException').val('');
        }
    },$('#newException'));

    $('#reparse').click(function(){
        console.log('reparse');
        if(!json){
            return ;
        }
        var txt= JSON.stringify(json);

        $(this).prop('disabled',true);
        $("span", this).text("Please wait...");
        $.ajax({
            type: "POST",
            url: "/api/reparse",
            data: 'text='+txt,
            success: function(data){
                $("#reparse").prop('disabled',false);
                $("#reparse span").text("Identify Lexical");
                if(data.error){
                    onError(data);
                }else{
                    try{
                        json = JSON.parse(data.data);
                    }catch(e){
                        console.log(e)
                    }
                    var str =parseJSON(json);
                    changeContent(str);
                    $( "#main-tabs" ).tabs( "option", "active", 0 );
                }

            }
        });
    });

    $('#download').click(function(){
        if(!json){
            alert('Please select a file to download.');
            return ;
        }
        var name = $('#filename').val().trim();
        if(name.length==0){
            alert('Please enter a valid filename.');
            return ;
        }
        var contents = JSON.stringify(json);
        $.post('api/download',{contents:contents},function(data){
            console.log(data);
            if(data.error){
                onError(data);
            } else{
                window.open('api/download?filename='+name);

            }
        })
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
                filterRecord();

            }
        });
    });

    $('#selectIns').change(function(ev){
        ins=$(this).find('option:selected').val();
        resetSelect('clsSelector',createOption('All Class','all'));
        resetSelect('studentSelector',createOption('All Student','all'));
        $.get('/api/listClass?instructor='+ins,function(data){
            if(data.error)
                onError(data);
            else{
                var v = data.data;
                for(var i=0;i< v.length;i++)
                    $('#clsSelector').append(createOption(v[i].CLASSNAME,v[i].CRN));
            }
        });
        filterRecord();
    });

    $('#clsSelector').change(function(ev){
        classcrn = $(this).find('option:selected').val();
        resetSelect('studentSelector',createOption('All Student','all'));
        $.get('/api/listStudent?crn='+classcrn,function(data){
            if(data.error)
                onError(data);
            else{
                var v = data.data;
                for(var i=0;i< v.length;i++){
                    var name;
                    if(v[i].FNAME)
                        name = v[i].FNAME+' '+v[i].LNAME;
                    else
                        name = v[i].USERNAME;
                    $('#studentSelector').append(createOption(name,v[i].USERID));
                }
            }
        });
        filterRecord();
    });
    $('#studentSelector').change(function(ev){
        student = $(this).find('option:selected').val();
        filterRecord();
    });

    //TODO for future developer,
    // Add batch process to server side,
    // use a single http post rather than tens of http get.
    // TODO also for adding student to class.
    $('#batchCreate').click(function(e){
        var oduMode = $('#fileType').find(':selected')[0].value=='odu';
        var arr = $('#fileContent').text().split('\n');
        var students='';
        var count = 0;
        var fail= 0;
        var exist = 0;
        arr = arr.filter(function(line){
            if(line.trim().length==0)
                return false;
            return true;
        });
        var size = arr.length;

        try{
            arr.forEach(function(line){
                line = line.trim();
                if(line.length==0)// avoid blank line.
                    return ;
                var username,password, fname,lname;
                if(oduMode){
                    var token = line.split(":");
                    username =token[4].toLowerCase().trim();
                    students+=username+',';
                    password = token[3].trim();
                    var name = toTitleCase(token[2].trim());
                    var namev = name.split(' ',2);
                    fname = namev[1];
                    lname = namev[0];
                }else{ // csv mode;
                    var token = line.split(",");
                    username = token[0].trim().toLowerCase();
                    students+=username+',';
                    password = token[1].trim();
                    fname= toTitleCase(token[2]);
                    lname=toTitleCase(token[3]);
                }
                $.get('/api/addUser?fname='+fname+'&lname='+lname+'&username='+username+
                '&password='+password+'&usertype=2',function(data){
                    if(data.error){
                        if(data.error=='User exist.')
                            exist++;
                        else{
                            onError(data);
                            fail++;
                        }

                    }
                    count ++;
                    if(count==size){ // finished
                        $('#displayStudent').text(students.substr(0,students.length-1));
                        showMessage('Creating '+size+' students, '+exist+ ' user existed, '+fail+' failed.');
                    }
                });
            })
        }catch(err){
            showError("Error while parse the file, check file format or contact admin.");
            console.log(err);
        }

    });

    $('#csvOpen').change(function(ev){
        console.log('changed');
        if(this.disabled){
            // do upload and re-download
            return alert('File upload not supported!');

        }else{
            var F = this.files;
            var reader = new FileReader();
            reader.onload=function(e){
                var text = this.result;
                if($('#fileType').find(':selected')[0].value=='odu'){
                    text= replaceAll('  ','',text); // for better view
                }
                $('#fileContent').text(text);
                $('#hiddenFile').val('');
            };
            reader.readAsText(F[0]);
        }

    });
    $('#reloadClassPicker').click(function(){
        $.get('api/listClassOwn?',function(data){
            var select= $('#classPicker');
            if(data.error){
                onError(data);
            }else{
                select.text('');
                for(var i=0;i<data.data.length;i++){
                    var obj = data.data[i];
                    var text = obj.CLASSNAME;
                    var value = obj.CRN+tokenDelimiter+obj.USERID;
                    var option = createOption(text,value);
                    select.append(option);
                }
            }
        });
    });

    var selectCrn,selectUserid;
    $("#classPicker").change(function(ev){
        var sp = $(this).find(':selected')[0].value.split(tokenDelimiter);
        selectCrn = sp[0];
        selectUserid = sp[1];
        $.get('api/getPermission?crn='+selectCrn+'&instructor='+userid,function(data){
            console.log(data);
            if(data.error)
                onError(data);
            else{
                $('#ClassOption').find('tr').remove();
                for(var i=0; i<data.data.length;i++){
                    var obj = data.data[i];
                    var tr = makeEl('tr');
//                <tr>
//                    <th><input type="checkbox" val="test" /> </th>
//                    <td>My test class</td>
//                    </tr>
                    var th = makeEl('th');
                    $(th).html("<input class='sfp' type='checkbox' value='"+obj.FILEID+"'" +(obj.CRN?'checked=true':'') +" />");
                    var td =makeEl('td');
                    $(td).html(obj.FILENAME);
                    $(tr).append(th).append(td);
                    $('#ClassOption').append(tr);
                }
            }
        });
    });

    $('#ClassOption').on('click','.sfp',function(){
        var fileid = $(this)[0].value;
        $.get('/api/changePermission?crn='+selectCrn+'&fileid='+fileid+($(this)[0].checked?'':'&del=true'),function(data){
            console.log(data);
            if(data.error)
                onError(data);
            else{

            }
        });
    });


    $('#reloadFile').click(function(){
        $.get('api/getFiles?',function(data){
            var select= $('#leftFile');
            if(data.error){
                onError(data);
            }else{
                select.text('');
                for(var i=0;i<data.data.length;i++){
                    var obj = data.data[i];
                    var text = obj.USERNAME? obj.FILENAME+'('+obj.USERNAME+')':obj.FILENAME;
                    var value = obj.FILEID+'-'+obj.USERID;
                    var option = createOption(text,value);
                    select.append(option);
                }
            }
        });
    });

    var fileid,userid;
    $("#leftFile").change(function(ev){
        var sp = $(this).find(':selected')[0].value.split('-');
        fileid = sp[0];
        userid = sp[1];
        $.get('api/getPermission?fileid='+fileid+'&instructor='+userid,function(data){
            console.log(data);
            if(data.error)
                onError(data);
            else{
                $('#option').find('tr').remove();
                for(var i=0; i<data.data.length;i++){
                    var obj = data.data[i];
                    var tr = makeEl('tr');
//                <tr>
//                    <th><input type="checkbox" val="test" /> </th>
//                    <td>My test class</td>
//                    </tr>
                    var th = makeEl('th');
                    $(th).html("<input class='sfp' type='checkbox' value='"+obj.CRN+"'" +(obj.FILEID?'checked=true':'') +" />");
                    var td =makeEl('td');
                    $(td).html(obj.CLASSNAME);
                    $(tr).append(th).append(td);
                    $('#option').append(tr);
                }
            }
        });
    });

    $('#option').on('click','.sfp',function(){
        var crn = $(this)[0].value;
        $.get('/api/changePermission?crn='+crn+'&fileid='+fileid+($(this)[0].checked?'':'&del=true'),function(data){
            console.log(data);
            if(data.error)
                onError(data);
            else{

            }
        });
    })
}




instructorBinding();
$( "#main-tabs" ).tabs( "option", "active", 2 );
