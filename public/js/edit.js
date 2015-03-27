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
function addClick(){
    $('.word').on('contextmenu',function( event ) {
        currentTarget = event.currentTarget;
        console.log(json);
        console.log(event);
    });

    $.contextMenu({
        selector: '.word',
        callback: function(key, options) {
            console.log(options);
            for(var i=0;i<options.length;i++)
                console.log(options[i]);
            console.log(key+' selected');
            var id  = currentTarget.id;
            //var class =
            var idList = id.split('_');
            var token = getTokenById(idList);
            if(token){
                if(key =='add'){
                    token.slashed= 'true';
                    var next;
                    var insertAfterID = id;
                    if(token.tagged=='Exception'){
                        next = currentTarget.parentElement.nextElementSibling;
                        insertAfterID =currentTarget.parentElement.id;
                    }else{
                        next = currentTarget.nextElementSibling;
                    }
                    if(next ==null || next.className!='Slash'){
                        $('<span class="Slash" style="display: inline;"> /</span>').insertAfter($("#"+insertAfterID));
                    }
                }else if(key =='remove'){
                    token.slashed = 'false';
                    var next;
                    if(token.tagged=='Exception'){
                        next = currentTarget.parentElement.nextElementSibling;
                    }else{
                        next = currentTarget.nextElementSibling;
                    }
                    if(next !=null && next.className=='Slash'){
                        next.remove();
                    }
                }else{ // modify type
                    var old = token.tagged;
                    token.tagged = key;
                    // can do some logging of   change from old to key;
                }
            }
        },
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
                    "Noun":{  name:"Noun" },
                    "NN":{  name:"Noun, singular or mass" },
                    "NNS":{  name:"Noun, plural" },
                    "NNP":{  name:"Proper noun, singular" },
                    "NNPS":{  name:"Proper noun, plural" }
                }
            },
            "Pronoun": {//Pronoun			white-blue 			"PRP,PRP\\$,WP\\$,WP,WDT PNOUN"
                name: "Pronoun",
                items: {
                    "Pronoun":{  name:"Pronoun" },
                    "PRP":{  name:"Personal pronoun" },
                    "PRP$":{  name:"Possessive pronoun" },
                    "WP":{  name:"Wh­pronoun" },
                    "WP$":{  name:"Possessive wh­pronoun" },
                    "WDT":{  name:"Wh­determiner" }
                }
            },
            "Verb": {//Verb			red					"VB,VBD,VBG,VBN,VBP,VBZ,MD VERB"
                name: "Verb",
                items: {
                    "Verb":{  name:"Verb" },
                    "VB":{  name:"Verb, base form" },
                    "VBD":{  name:"Verb, past tense" },
                    "VBG":{  name:"Verb, gerund or present participle" },
                    "VBN":{  name:"Verb, past participle" },
                    "VBP":{  name:"Verb, non­3rd person singular present" },
                    "VBZ":{  name:"Verb, 3rd person singular present" },
                    "MD":{  name:"Modal" }
                }
            },
            "Adverb": {//Adverb			white-red			"RB,RBR,RBS,WRB ADV"
                name: "Adverb",
                items: {
                    "RB":{  name:"Adverb" },
                    "RBR":{  name:"Adverb, comparative" },
                    "RBS":{  name:"Adverb, superlative" },
                    "WRB":{  name:"Wh­adverb" }
                }
            },
            "Adjective": {//Adjective		green				"JJ,JJR,JJS ADJ"
                name: "Adjective",
                items: {
                    "JJ":{  name:"Adjective" },
                    "JJR":{  name:"Adjective, comparative" },
                    "JJS":{  name:"Adjective, superlative" }
                }
            },
            "Conjunction": {//Conjunction     white-green			"CC CONJ"
                name: "Conjunction",
                items: {
                    "Conjunction":{  name:"Conjunction" },
                    "CC":{  name:"Coordinating conjunction" }
                }
            },
            "Preposition": {//Preposition     Burgundy			"TO,IN PREP"
                name: "Preposition",
                items: {
                    "Preposition":{  name:"Preposition" },
                    "TO":{  name:"To" },
                    "IN":{  name:"Preposition or subordinating conjunction" }
                }
            },
            "Article": {//Article         white-Burgundy		"DT ART"
                name: "Article",
                items: {
                    "Article":{  name:"Article" },
                    "DT":{  name:"Determiner" }
                }
            },
            "Other": {
                name: "Other",
                items: {
                    "CD":{  name:"Cardinal number" },
                    "EX":{  name:"Existential there" },
                    "FW":{  name:"Foreign word" },
                    "LS":{  name:"List item marker" },
                    "PDT":{  name:"Predeterminer" },
                    "POS":{  name:"Possessive ending" },
                    "RP":{  name:"Particle" },
                    "SYM":{  name:"Symbol" },
                    "UH":{  name:"Interjection" },
                    "Other":{  name:"Other" }
                }
            },
            "sep1": "---------",
            "add":{ name:"add Slash"},
            "remove":{name:"remove Slash"}
        }
    });
}
