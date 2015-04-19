/**
 * Created by Ming on 3/26/2015 0026.
 */

var GlobalClass, GlobalId,currentTarget;

function getTokenById(idList){
    if(json){
        return json.contents[idList[0]][idList[1]].tokens[idList[2]];
    }
    return null;
}

function slashCallBack(key,options){
    var id  = currentTarget.id;
    var idList = id.split('_');
    var token = getTokenById(idList);// grep a reference to the associated json element
    if(token){  // if token exists
        var next;
        var insertAfterID = id;
        if(token.tagged=='Exception'){  // add/remove slash after exception, never add slash within exception
            // get current word's parent and get nextElement.
            next = currentTarget.parentElement.nextElementSibling;
            insertAfterID =currentTarget.parentElement.id;
        }else{
            next = currentTarget.nextElementSibling;
        }
        if(key =='add'){
            token.slashed= 'true';
            if(next ==null || next.className!='Slash'){
                $('<span class="Slash" style="display: inline;"> /</span>').insertAfter($("#"+insertAfterID));
            }
        }else if(key =='remove'){
            delete token['slashed'];
            if(next !=null && next.className=='Slash'){
                next.remove();
            }
        }
    }
}
function changePOS(key, options) {
    var keys = key.split(' ');
    var id  = currentTarget.id;
    var idList = id.split('_');
    var token = getTokenById(idList);
    if(token){
        if(token.tagged=='Exception'){
            //nested token.
            token = token.tokens[idList[3]];
        }
        var old = token.tagged;
        token.tagged = keys[1];  // set pos in json.

        // notes:
        //could add implementation to log change pos event
        //to help improve the nltk performance.


        //change current div to new Class
        $('#'+id).removeClass(old).addClass(keys[1]);

        // re-colorized text;
        if(keys[0]!='Other'){
            $("#"+keys[0]).trigger('click').trigger('click');
        }else{ // set text to black/white
            $('#'+id).css('color','black').css('background-color','white').css('font-weight','inherit');
        }
    }
}

function addClick(enable){
    if(!enable){
        $.contextMenu( 'destroy', '.word' );
        return ;
    }
    $('.word').on('contextmenu',function( event ) {
        currentTarget = event.currentTarget;
    });

    $.contextMenu({
        selector: '.word',
        callback: changePOS,
        items: {

    //Noun 			blue				"NN,NNS,NNP,NNPS NOUN"				#008CFF
    //Pronoun			white-blue 			"PRP,PRP\\$,WP\\$,WP,WDT PNOUN"
    //Verb			red					"VB,VBD,VBG,VBN,VBP,VBZ,MD VERB"	#990000
    //Adverb			white-red			"RB,RBR,RBS,WRB ADV"
    //Adjective		green				"JJ,JJR,JJS ADJ"					#437A00
    //Conjunction     white-green			"CC CONJ"
    //Preposition     Burgundy			"TO,IN PREP"						purple
    //Article         white-Burgundy		"DT ART"


            "Noun": { //Noun 			blue				"NN,NNS,NNP,NNPS NOUN"				#008CFF
                name: "Noun",
                items: {
                    "Noun Noun":{  name:"Noun" },
                    "Noun NN":{  name:"Noun, singular or mass" },
                    "Noun NNS":{  name:"Noun, plural" },
                    "Noun NNP":{  name:"Proper noun, singular" },
                    "Noun NNPS":{  name:"Proper noun, plural" }
                }
            },
            "Pronoun": {//Pronoun			white-blue 			"PRP,PRP\\$,WP\\$,WP,WDT PNOUN"
                name: "Pronoun",
                items: {
                    "Pronoun Pronoun":{  name:"Pronoun" },
                    "Pronoun PRP":{  name:"Personal pronoun" },
                    "Pronoun PRP$":{  name:"Possessive pronoun" },
                    "Pronoun WP":{  name:"Wh­pronoun" },
                    "Pronoun WP$":{  name:"Possessive wh­pronoun" },
                    "Pronoun WDT":{  name:"Wh­determiner" }
                }
            },
            "Verb": {//Verb			red					"VB,VBD,VBG,VBN,VBP,VBZ,MD VERB"
                name: "Verb",
                items: {
                    "Verb Verb":{  name:"Verb" },
                    "Verb VB":{  name:"Verb, base form" },
                    "Verb VBD":{  name:"Verb, past tense" },
                    "Verb VBG":{  name:"Verb, gerund or present participle" },
                    "Verb VBN":{  name:"Verb, past participle" },
                    "Verb VBP":{  name:"Verb, non­3rd person singular present" },
                    "Verb VBZ":{  name:"Verb, 3rd person singular present" },
                    "Verb MD":{  name:"Modal" }
                }
            },
            "Adverb": {//Adverb			white-red			"RB,RBR,RBS,WRB ADV"
                name: "Adverb",
                items: {
                    "Adverb RB":{  name:"Adverb" },
                    "Adverb RBR":{  name:"Adverb, comparative" },
                    "Adverb RBS":{  name:"Adverb, superlative" },
                    "Adverb WRB":{  name:"Wh­adverb" }
                }
            },
            "Adjective": {//Adjective		green				"JJ,JJR,JJS ADJ"
                name: "Adjective",
                items: {
                    "Adjective JJ":{  name:"Adjective" },
                    "Adjective JJR":{  name:"Adjective, comparative" },
                    "Adjective JJS":{  name:"Adjective, superlative" }
                }
            },
            "Conjunction": {//Conjunction     white-green			"CC CONJ"
                name: "Conjunction",
                items: {
                    "Conjunction Conjunction":{  name:"Conjunction" },
                    "Conjunction CC":{  name:"Coordinating conjunction" }
                }
            },
            "Preposition": {//Preposition     Burgundy			"TO,IN PREP"
                name: "Preposition",
                items: {
                    "Preposition Preposition":{  name:"Preposition" },
                    "Preposition TO":{  name:"To" },
                    "Preposition IN":{  name:"Preposition or subordinating conjunction" }
                }
            },
            "Article": {//Article         white-Burgundy		"DT ART"
                name: "Article",
                items: {
                    "Article Article":{  name:"Article" },
                    "Article DT":{  name:"Determiner" }
                }
            },
            "Other": {
                name: "Other",
                items: {
                    "Other CD":{  name:"Cardinal number" },
                    "Other EX":{  name:"Existential there" },
                    "Other FW":{  name:"Foreign word" },
                    "Other LS":{  name:"List item marker" },
                    "Other PDT":{  name:"Predeterminer" },
                    "Other POS":{  name:"Possessive ending" },
                    "Other RP":{  name:"Particle" },
                    "Other SYM":{  name:"Symbol" },
                    "Other UH":{  name:"Interjection" },
                    "Other Other":{  name:"Other" }
                }
            },
            "sep1": "---------",
            "add":{ name:"add Slash", callback: slashCallBack},
            "remove":{name:"remove Slash", callback: slashCallBack},
            "sep2": "---------",
            "stress":{name:"Stress", callback:stressCallBack},
            "unstress":{name:"Unstress", callback:stressCallBack},
            "addVo":{name:"add vocabulary", callback:vocabCallBack},
            "delVo":{name:"delete vocabulary", callback:vocabCallBack},
            "sep3": "---------",
            'delete':{ name:"Remove", callback:removeCallBack}
            //"delVo":{name:"delete vocabulary", callback:vocabCallBack},
        }
    });
}

function stressCallBack(key, options){
    var id  = currentTarget.id;
    var idList = id.split('_');
    var token = getTokenById(idList);// grep a reference to the associated json element
    if(token){
        if(key=='stress'){
            token['stress']=true;
            $('#'+id).addClass('stress').css('font-weight','bold');
        }else{
            delete token['stress'];
            $('#'+id).removeClass('stress').css('font-weight','inherit');
        }
    }
}
function vocabCallBack(key, options){
    var id  = currentTarget.id;
    var idList = id.split('_');
    var token = getTokenById(idList);// grep a reference to the associated json element

    if(token){
        if(key=='addVo'){
            token['vocab']=true;
            $('#'+id).addClass('vocab').css('font-style','italic');
        }else{
            delete token['vocab'];
            $('#'+id).removeClass('vocab').css('font-style','inherit');
        }
    }
}

function removeCallBack(key, options){
    var id  = currentTarget.id;
    var idList = id.split('_');
    if(json){
        var result = confirm('Are you sure to delete "'+$("#"+id).text()+'"? This action cannot be undone.');
        if(result==true) {
            var token = json.contents[idList[0]][idList[1]].tokens[idList[2]];
            if(token.tagged=='Exception'){
                delete token.tokens[idList[3]];
            }else{
                delete json.contents[idList[0]][idList[1]].tokens[idList[2]];
            }
            $('#' + id).remove();

        }
    }

}