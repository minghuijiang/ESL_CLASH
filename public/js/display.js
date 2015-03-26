function changeColor(type,color,isChecked,bgcolor,isbold){
	var list = type.split(',');
	if(isChecked){
		for(i=0; i<list.length;i++){
			if(bgcolor)
				if(isbold)
					$("."+list[i]).css("color",color).css("font-weight",'bold');
				else
					$("."+list[i]).css("color",color).css("background-color",bgcolor);
			else
				$("."+list[i]).css("color",color);
		}
	}else{
		for(i=0; i<list.length;i++)
			$("."+list[i]).css("color","black").css("background-color","white").css("font-weight",'inherit');
	}
}

function hideSlash(isChecked){
	if(isChecked){
		$(".Slash").show();
	}else{
		$(".Slash").hide();
	}
}

function boldException(isChecked){
	if(isChecked){
		$(".Exception").css("font-weight","bold");
	}else{
		$(".Exception").css("font-weight","normal");
	}
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
    return getOpenTag('span','word '+token['tagged'],id)+token['word']+getCloseTag('span');
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

        if(token['slashed']=='true'){
            str+=getOpenTag('span','Slash')+'/'+getCloseTag('span')+' ';
        }
    }
    return str;
}

function startReader(){
	if(!json){
		alert('Clash a text before reading');
		return ;
	}
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