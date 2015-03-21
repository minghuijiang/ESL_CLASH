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


function parseJSON(json){
	var contents = json.contents;
	var str = "";
	for(i=0; i<contents.length;i++){
		str+="<p class =\"paragraph\">\n";
		var para = contents[i];
		for(j=0;j<para.length;j++){
			str+="<span class =\"sentence\">\n";
			
			var sent = para[j].tokens;
			
			for(z=0;z<sent.length;z++){
				var token = sent[z];
				if(token['tagged']=="Exception"){
					str+="<span class=\""+token['tagged']+"\">";
					var nestTokens = token['tokens'];
					for(y=0;y<nestTokens.length;y++){
						var ntoken = nestTokens[y];
						str+="<span class=\""+ntoken['tagged']+"\">"+ntoken['word']+"</span>";
						if(y!= nestTokens.length-1)
							str+=" ";
					}
					str+="</span>";
					
				}else{
					str+="<span class=\""+token['tagged']+"\">"+token['word']+"</span>";
					if(z!= sent.length-2)
						str+=" ";
				}
				if(token['slashed']=='true'){
					str+="<span class=\"Slash\">/</span>";
				}
			}
			
			str+="</span>";
		}
		
		str+="</p>\n";
		
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