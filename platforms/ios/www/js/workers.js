// https://translate.yandex.net/api/v1.5/tr.json/translate?text=Chinese&lang=en-fr&key=trnsl.1.1.20171208T164521Z.ea60be31a46ed7c4.3556a0279f6656abc78a410a5af8eb2fec3c8a84


//CONSTANTS
var APIKEY = "trnsl.1.1.20171208T164521Z.ea60be31a46ed7c4.3556a0279f6656abc78a410a5af8eb2fec3c8a84";
var STARTSTR = {"en":"To be or not to be", "fr":"Maître corbeau sur un arbre perché...", "es":"hola", "it":"ciao", "de":"guten tag"};//default phrase to translate at start
var NUMLANGS = 4;//number of translation steps at start
var HELPTXT = {"fr":"<h1>Bienvenue dans Chinese Whispers !</h1><p>Ecrivez un mot, une phrase, une expression en haut de la fenêtre de l'appli, cliquez sur le bouton et voyez ce que votre expression est devenue après traductions successives dans les langues affichées au milieu de la fenêtre.</p><p>Changez, ajoutez ou enlevez des langues pour modifier la successions de traductions pour enrichir l'expérience</p><p>Vous n'êtes pas au bout de vos surprises !</p>", "en":"<h1>Welcome to Chinese Whispers!</h1><p>Enter a word, a phrase or an expression into the top bar of the app, click the button and see how your input has turned after successive translations into the languages shown in the middle of the app.</p><p>Change, add or cancel languages to modify the translation and enhance your experience.</p><p>Have fun!</p>"};

//variables
var resp = {};
var dejavu = [];//langs already used in random function. Not to be used again.
var tempText;

onmessage = function (event) {
	resp.purpose = event.data.purpose;
	switch (event.data.purpose) {//action en fonction du param
	case "translate":
		for (var i = 0; i < event.data.someLangs.length; i++) {
			if (i == 0){
				translateText(event.data.defLang, event.data.allLangs[event.data.someLangs[i]], event.data.startStr, function(r){
					tempText = JSON.parse(r).text[0];
				});
			}else{
				translateText(event.data.allLangs[event.data.someLangs[i-1]], event.data.allLangs[event.data.someLangs[i]], tempText, function(r){
					tempText = JSON.parse(r).text[0];
				});
			}
		}
		translateText(event.data.allLangs[event.data.someLangs[event.data.someLangs.length-1]], event.data.defLang, tempText, function(r){
			tempText = JSON.parse(r).text[0];
		});
		
		resp.finalStr = tempText;
		resp.someLangs = event.data.someLangs;

		postMessage (resp)
		break;

	case "getAllLangs":
   //récupération des languages disponibles
		getAllLanguages("en", function(response){
			var lgs = JSON.parse(response).langs;
			var langs = {};
			for (var i in lgs) {
				translateText("en", event.data.lang, lgs[i], function(resp){
					var txt = JSON.parse(resp).text[0];
					txt = txt.replace('La Colline De Mari', 'Mari des Montagnes');
					txt = txt.replace('Les ', '');
					txt = txt.replace('Le ', '');
					txt = txt.replace("L'", '');
					txt = txt.replace("D'", '');
					txt = txt.replace('La ', '');
					txt = txt.trim();
					txt = txt.charAt(0).toUpperCase() + txt.slice(1);
					langs[txt] = i;
				});
			}

			const ordered = {};
			Object.keys(langs).sort().forEach(function(key) {
			  ordered[key] = langs[key];
			});
			resp.langs = ordered;

		});
		postMessage (resp)
      break;
   
   case "getHelpTxt":
      if (event.data.lang == "fr" || event.data.lang == "en"){
         resp.helpTxt = HELPTXT[event.data.lang]
      }else if (event.data.lang != "fr" && event.data.lang != "en"){
   		translateText("fr", event.data.lang, HELPTXT.fr, function(r){
   			txt = JSON.parse(r).text[0];
   		});
         resp.helpTxt = txt;
      }
      postMessage (resp)
      break;
   
	case "getStartTranslation":
		//Réponse traduction de démarrage
      var langs = event.data.langs;
		var someRandomLangs = [];
		for (var i = 0; i < 4; i++) {
			var l = randomLang(langs, event.data.lang);
			someRandomLangs.push(l);
			if (i == 0){
				translateText(event.data.lang, langs[l], STARTSTR[event.data.lang], function(r){
					tempText = JSON.parse(r).text[0];
				});
			}else{
				translateText(langs[someRandomLangs[i-1]], langs[l], tempText, function(r){
					tempText = JSON.parse(r).text[0];
				});
			}
		}
		translateText(langs[someRandomLangs[someRandomLangs.length-1]], event.data.lang, tempText, function(r){
			tempText = JSON.parse(r).text[0];
		});
		resp.startStr = STARTSTR[event.data.lang];
		resp.finalStr = tempText;
		resp.someLangs = someRandomLangs;

		postMessage (resp)
      break;

   case "oneMoreLang":
      var l = randomLang(event.data.langs);
      resp.oneMoreLang = l;
		postMessage (resp)
      break;
	default:
		postMessage ("manque le purpose")
	}

}

function randomLang(list, defLang){//generates random lang, not existing in dejavu[].
	var keys = [];
	for (var l in list){
		if (keys.indexOf(l) == -1)
			keys.push(l);
	}
	var i = parseInt(Math.random()*(keys.length-1));
	if (keys[i] !== 'undefined'){
		if (dejavu.indexOf(keys[i]) != -1 || keys[i] == defLang){
			randomLang(list);
		}else{
			dejavu.push(keys[i]);
		}
		return keys[i];
	}
}


function getAllLanguages(lang, cb){
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			if( typeof cb === 'function' )
				cb(xhttp.response);
		}
	};
	xhttp.open("POST", "https://translate.yandex.net/api/v1.5/tr.json/getLangs?", false);
	xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xhttp.setRequestHeader("Accept", "*/*");
	xhttp.send("ui="+lang+"&key="+APIKEY); 
}

function translateText(sourceLang, targetLang, text, cb){
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			if( typeof cb === 'function' )
				cb(xhttp.response);
		}
	};
	xhttp.open("POST", "https://translate.yandex.net/api/v1.5/tr.json/translate?", false);
	xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xhttp.setRequestHeader("Accept", "*/*");
	xhttp.send("text="+text+"&lang="+sourceLang+"-"+targetLang+"&key="+APIKEY); 
}

