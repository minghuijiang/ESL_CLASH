
var posMapper = {
    "Noun":{            color:"rgb(40,100,225)",       classes:"NN,NNS,NNP,NNPS,Noun"    },
    "Pronoun":{          bc:"rgb(40,100,225)",              classes:"PRP,PRP\\$,WP\\$,WP,WDT,Pronoun"     },
    "Verb":{            color:"rgb(230,0,0)",           classes:"VB,VBD,VBG,VBN,VBP,VBZ,MD,Verb"    },
    "Adverb":{          bc:"rgb(230,0,0)",              classes:"RB,RBR,RBS,WRB,Adverb"    },
    "Adjective":{      color:"rgb(0,150,30)",          classes:"JJ,JJR,JJS,Adjective"    },
    "Conjunction":{    bc:"rgb(0,150,30)",             classes:"CC,Conjunction"    },
    "Preposition":{    color:"rgb(115,55,155)",       classes:"TO,IN,Preposition"    },
    "Article":{         bc:"rgb(115,55,155)",          classes:"DT,Article"    }
};

function changeColor(checkbox){
    var data = posMapper[checkbox.id];
    var cl = "."+replaceAll(',',',.',data['classes']);
    console.log(cl);
    console.log(checkbox.checked);
    if(checkbox.checked){
        if(data['color']){// color font, bold, white background.
            $(cl).css("color",data['color']);//.css("font-weight",'bold');
        }else{ // white font, color background.
            $(cl).css("color","white").css("background-color",data['bc']);
        }
    }else{
        $(cl).css("color","black").css("background-color","white").css("font-weight",'inherit');
    }
}

function enablePOS(ischecked){
    if(ischecked)
        $('#pos').show();
    else
        $('#pos').hide();
}

function toggleAllPOS(ischecked){
    var objs  = $('#pos').find("input" );
    objs.each(function( index ) {
        if($(this)[0]['checked']!=ischecked)
            $(this).trigger('click');
    })
}

function changeContent(str,filename){
    document.getElementById("content").innerHTML = str;
    if($('#Slash')[0]['checked']!=true){
        $('#Slash').trigger('click');
    }
    if($('#edit')[0]&&$('#edit')[0]['checked']!=true){
        $('#edit').trigger('click');
    }
    revalidateAllCheckBox();
    if(filename)
        $('#filename').val(filename);
}

function changeSlash(checked){
    console.log('clicked: '+checked);
    if(checked){
        $('<br />').insertAfter($('.Slash'));
        if($('#Slash')[0]['checked']==true){
            $('#Slash').trigger('click');
        }
    }else{
        $('.Slash').each(function(){
            var next =this.nextElementSibling;
            console.log(next);
            if($(next).is('br')){
                next.remove();
            }
        });

    }

}

function revalidateAllCheckBox(){
    var objs  = $(":checkbox" );
    objs.each(function( index ) {
        if($(this)[0]['checked']==true&&$(this)[0].id!='All'){
            $(this).click().click();
        }

    })
}
function replaceAll(find, replace, str) {
    return str.replace(new RegExp(find, 'g'), replace);
}

function hideSlash(isChecked){
    isChecked?$(".Slash").show():$(".Slash").hide();
}

function boldException(isChecked){
	$(".Exception").css("font-weight",isChecked?"bold":"normal");
}

function showVocab(isChecked){
    $(".vocab").css("font-style",isChecked?"italic":"inherit");
}

function showStress(isChecked){
    $(".stress").css("font-weight",isChecked?"bold":"inherit");
}

function getOpenTag(tag,clazz, id){
    if(clazz){
        if(id){ // class and id
            return "<"+tag+" class=\""+clazz+"\" id=\""+id+"\">";
        }else{  // class no id
            return "<"+tag+" class=\""+clazz+"\">";
        }
    }else{  // no class no id
        return "<"+tag+">";
    }
}
function getCloseTag(tag){
    return "</"+tag+">";
}

function parseToken(token,id){
    var clazz = 'word '+token['tagged'];
    if(token['vocab'])   // if vocabulary
        clazz+=' vocab';
    if(token['stress'])  // if stressed.
        clazz+=' stress';
    return getOpenTag('span',clazz,id)+token['word']+getCloseTag('span');
}

//The word weather means “the atmospheric conditions at a specific place and time.” The weather can vary from day to day.
function parseJSON(json){
	var contents = json.contents;
	var str = "";

	for(var i=0; i<contents.length;i++){
		str+=getOpenTag('p','paragraph')+"\n";
		var para = contents[i];
		for(var j=0;j<para.length;j++){
            var id = i+'_'+j;
			str+=getOpenTag('span','sentence')+"\n";
			var sent = para[j].tokens;
			str+=parseSentence(sent,id);
			str+=getCloseTag('span');
		}
		
		str+=getCloseTag('p')+"\n";
	}

	return str;
}

function parseSentence(sent, vid){
    var str="";
    var openDouble = false;   // if double qoute is open, next double qoute attach to word in left, else attach to right
    var openSingle = false;  // as above
    var attachRight = false; //
    for(var z=0;z<sent.length;z++){
        var token = sent[z];
        var id =vid+ "_"+z;
        if(token['tagged']=="Exception"){
            str+=getOpenTag('span','Exception',id);
            str+=parseSentence(token['tokens'],id);
            str+=getCloseTag('span');
        }else if(token['tagged']=='Symbol'){
            var w = token['word'];
            switch(w){
                case '.':case '!':case '?':
                case ',':case ';':case ':':
                case ')':case ']':case '>': // those punctuation attach to word on left.
                //str+="<span class=\""+token['tagged']"+\" id=\""+id+"\">"+token['word']+"</span>";
                    str+=parseToken(token,id);
                    break;
                case '(':
                case '[':
                    attachRight = true;
                    str+=" "+parseToken(token,id);
                    break;
                case '"':
                case "``":
                    token.word='"';
                    if(openDouble){ // close double quotes attach to left
                        str+=parseToken(token,id);
                    }else{     // open quote attach to right;
                        str+=" "+parseToken(token,id);
                        attachRight = true;
                    }
                    openDouble=!openDouble;
                    break;
                case '\'':
                    if(openSingle){ // close single, attach to right
                        str+=parseToken(token,id);
                    }else{  // open single, a
                        str+=" "+parseToken(token,id);
                        attachRight = true;
                    }
                    openSingle=!openSingle;
                    break;
                default :
                    str+=" "+parseToken(token,id);
                    console.log('unknown symbol =  '+token.word);
                    break;
            }
        }
        else{
            if(attachRight){
                str+=parseToken(token,id);
                attachRight = false;
            }
            else{
                str+=" "+parseToken(token,id);
            }
        }

        if(token['slashed']){
            str+=' <span class="Slash">/</span> ';
        }
    }
    return str;
}

function startReader(){
	if(!json){
		alert('Please select  a text before reading');
		return ;
	}
    console.log(window.sq);
  if(window.sq){
	sq.again();
	// window.sq.closed && window.document.dispatchEvent(new Event('squirt.again'));
  } else {
	window.sq = {};
	s = document.createElement('script');
	s.src = 'squirt/squirt.js';
	document.body.appendChild(s);
  }
}

var ins='all',classcrn='all',student='all';



var recordData;



function resetSelect(id,option){
    $('#'+id).text('').append(option).prop('selectedIndex',0);
}
function filterRecord(){
    var sub = recordData.filter(function(el){
        if(ins!='all'&&el.INSTRUCTOR!=ins){
            return false;
        }
        if(classcrn!='all'&&el.CRN!=classcrn)
            return false;
        if(student!='all'&&el.USERID!=student)
            return false;
        return true;
    });
    var te = '<table style="width:100%" border="1">'+
        '<tr>'+
        '<td>Student</td><td>Class</td>'+
        '<td>File</td><td>Start Time</td>'+
        '<td>Finish Time</td><td>Time Spend</td>'+
        '<td>Start Speed</td><td>End Speed</td>'+
        '<td>Avg Speed</td><td>Word Read</td>'+
        '<td>Lexical Bundle Read</td><td>Regression</td>'+
        '<td>Fixation</td></tr>';
    for(var i=0;i<sub.length;i++){
        var d = sub[i];
        te+='<tr>'+
        '<td>'+ (d.FNAME? d.FNAME+' '+ d.LNAME: d.USERNAME) +'</td><td>'+ d.CLASSNAME+'</td>'+
        '<td>'+ d.FILENAME+'</td><td>'+ simpleTimeFormat(new Date(d.STARTTIME))+'</td>'+
        '<td>'+ simpleTimeFormat(new Date(d.ENDTIME))+'</td><td>'+ convertTimeToStr(d.TIME_SPENT)+'</td>'+
        '<td>'+ d.SSPEED+'</td><td>'+ d.ESPEED+'</td>'+
        '<td>'+ (d.WORD_READ/ (d.TIME_SPENT)*60).toFixed(2)+'</td><td>'+ d.WORD_READ+'</td>'+
        '<td>'+ d.LB_READ+'</td><td>'+ d.REGRESSION+'</td>'+
        '<td>'+ d.FIXATION+'</td></tr>';
    }
    te+='</table>';
    $('#recordDisplay').html(te);
}


function convertTimeToStr(s){
    var text ='';
    var sec =parseInt(s);
    if(sec>60){
        var min = parseInt(sec/60);
        if(min>60){
            var hour = parseInt(min/60);
            text+=hour+' hour ';
        }
        var rmin = min%60;
        text+= rmin+' min ';
    }
    var rsec = sec%60;
    text += rsec+' sec';
    return text;
}

var month=['Jan','Feb','Mar','Apr','May','June','July','Aug','Sept','Oct','Nov','Dec'];
// Day of week, Month, day, year, Hour, Min, Sec
function simpleTimeFormat(date){
    return month[date.getUTCMonth()]+' '+date.getDate()+' '+date.getFullYear()+' '+date.getHours()+':'+date.getMinutes()+':'+date.getSeconds();
}


function toTitleCase(str)
{
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}