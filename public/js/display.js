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

//The word weather means “the atmospheric conditions at a specific place and time.” The weather can vary from day to day.
function parseJSON(json){
	var contents = json.contents;
	var str = "";
    var openDouble = false;   // if double qoute is open, next double qoute attach to word in left, else attach to right
    var openSingle = false;  // as above
    var attachRight = false; //
	for(var i=0; i<contents.length;i++){
		str+=getOpenTag('p','paragraph')+"\n";
		var para = contents[i];
		for(var j=0;j<para.length;j++){
            var id = i+'_'+j;
            //console.log(id);
			str+=getOpenTag('span','sentence')+"\n";
			
			var sent = para[j].tokens;
            console.log(id);
			str+=parseSentence(sent,id);
			
			str+=getCloseTag('span');
		}
		
		str+=getCloseTag('p')+"\n";
	}

	return str;
}

function parseSentence(sent, vid){
    console.log('in json: '+sent);
    var str="";
    for(var z=0;z<sent.length;z++){
        var token = sent[z];
        //console.log('token: '+token['word']+ ' '+token['tagged']);
        var id =vid+ "_"+z;
        console.log(id);
        if(token['tagged']=="Exception"){
            //str+="<span class=\""+token['tagged']+"\" id=\""+id+"\">";
            //var nestTokens = token['tokens'];
            //for(y=0;y<nestTokens.length;y++){
            //    var ntoken = nestTokens[y];
            //    str+="<span class=\""+ntoken['tagged']+"\">"+ntoken['word']+"</span>";
            //    if(y!= nestTokens.length-1)
            //        str+=" ";
            //}
            //str+="</span>";
            str+=getOpenTag('span','Exception',id);

            //console.log('exception:' +token.tokens);
            //console.log('exception:' +token);

            str+=parseSentence(token['tokens'],id);
            //console.log('Exception: '+str);
            str+=getCloseTag('span');
        }else if(token['tagged']=='Punctuation'){
            str+="<span class=\""+token['tagged']+"\" id=\""+id+"\">"+token['word']+"</span>";
            if(z!= sent.length-2)
                str+=" ";
        }else{
            str+="<span class=\""+token['tagged']+"\" id=\""+id+"\">"+token['word']+"</span>";
            if(z!= sent.length-2)
                str+=" ";
        }
        if(token['slashed']=='true'){
            str+="<span class=\"Slash\">/</span>";
        }
    }
 //  console.log('finish sentence: '+str);
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