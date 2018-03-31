//variables
var defLang = navigator.language.split('-')[0];//default language based on browser settings
var allLangs;//list of all translatable languages translated in the default language
var W = new Worker("js/workers.js");//Web Worker
var params = {};//parameters to be passed to webworker
var someLangs;//list of translation language steps
var max = "";//maximum lenght of language names
var oneMoreLang;
var helpTxt;

if (localStorage.defLang && localStorage.defLang != defLang){
   localStorage.defLang = defLang;
	params.purpose = "getAllLangs";
	params.lang = localStorage.defLang;
	W.postMessage (params);
}else{
   localStorage.defLang = defLang;
}

//**********DEBUG*****************
// localStorage.removeItem("allLangs");
//**********DEBUG*****************


function init(){
   showTimer();
	var div	= document.getElementById('input');
	div.contentEditable = true;
   div.onclick = function(){
      window.getSelection().selectAllChildren(document.getElementById('input'));
   }
	div.onfocus = function () {
      if (!document.getElementById('button')){
   		var button = document.createElement("button");
   		button.innerHTML = "&#x025BD;";
   		button.id = "button";
   		button.onclick = function (event){
   			var txt = this.parentNode.getElementsByTagName("div")[0];
   			var str = txt.innerText.replace(/\n/g, '');
            translate(str);
            document.getElementById('inputWrapper').removeChild(this);
            window.getSelection().removeAllRanges  ();
   		}
   		document.getElementById("inputWrapper").appendChild(button)
      }
	}

   var helpButton = document.getElementById('helpButton');
   helpButton.onclick = function(){
      document.getElementById('helpTxtWrapper').style.display = "block";
   }
   var helpClose = document.getElementById('helpClose');
   helpClose.onclick = function(){
      document.getElementById('helpTxtWrapper').style.display = "none";
   }
  	if (!localStorage.allLangs || localStorage.allLangs == "undefined") {
		params.purpose = "getAllLangs";
		params.lang = localStorage.defLang;
		W.postMessage (params);
	}else{
		allLangs = localStorage.getObj("allLangs", allLangs);
      getStartTranslation();
	}

	if (!localStorage.helpTxt) {
		params.purpose = "getHelpTxt";
		params.lang = localStorage.defLang;
		W.postMessage (params);
	}else{
		helpTxt = localStorage.helpTxt;
      setHelpTxt();
	}

}

function setHelpTxt(){
   document.getElementById('helpTxt').innerHTML = helpTxt;
}

function getStartTranslation(){
   params.purpose = "getStartTranslation";
	params.lang = localStorage.defLang;
   params.langs = allLangs;
	W.postMessage (params);
}

function changeLang(el, selectedItem){
	var index = el.getAttribute('index');
	var id = el.id.replace("select_", "");
	someLangs[index] = selectedItem;
	var str = getInput();
	translate(str);
}
   
function translate(str){
	showTimer();
	document.getElementById("container").innerHTML = "";
	params.purpose = "translate";
	params.defLang = defLang;
	params.someLangs = someLangs;
	params.allLangs = allLangs;
	params.startStr = getInput();
	W.postMessage (params);
}

function del(id){
	var i = someLangs.indexOf(id);
	someLangs.splice(i, 1);
	var c = document.getElementById("div_" + id);
	document.getElementById("container").removeChild(c);
   var str = getInput();
   translate(str);
}

function add(){
	showTimer();
	params.purpose = "oneMoreLang";
	params.langs = allLangs;
	W.postMessage (params);
}


W.onmessage = function (event){
	switch (event.data.purpose) {//action en fonction du param
	case "translate":
		for (var l in event.data.someLangs) {
			row(someLangs[l], l);
		}
		row(defLang, 9999);
		setOutput(event.data.finalStr);
		hideTimer();
		break;
	case "getAllLangs":
		allLangs = event.data.langs;
		localStorage.setObj("allLangs", allLangs);
      getStartTranslation();
		break;
	case "getHelpTxt":
		helpTxt = event.data.helpTxt;
		localStorage.helpTxt = helpTxt;
      setHelpTxt();
		break;
   case "getStartTranslation":
		someLangs = event.data.someLangs;
		for (var l in someLangs) {
			row(someLangs[l], l);
		}
		row(defLang, 9999);
		setInput(event.data.startStr);
		setOutput(event.data.finalStr);
		hideTimer();
      break;
   case "oneMoreLang":
      someLangs.push(event.data.oneMoreLang);
		row(someLangs[l], l);
   	var str = getInput();
   	translate(str);
		hideTimer();
      break;
	default:
	}
	
}

function row(selectedItem, i) {
	var div = document.createElement('div');
	var moins = document.createElement('div');
	var select = document.createElement('select');
	moins.className = "moins";
	if (i == 9999){
		select.className = "hidden";
		div.id = "more";
	}

	if (i != 9999){
		for (var l in allLangs){
			var option = document.createElement('option');
			option.value = l;
			if (l == selectedItem){
				option.selected = true;
				select.id = "select_"+l;
				select.setAttribute("index", i);
				select.setAttribute("onchange", "changeLang(this, this.options[this.selectedIndex].value)");
				div.id = "div_" + l;
			}
			option.text = l + " >";
			if (option.text.length > max.length)
				max = option.text;
			select.appendChild(option);
		}
	}	
	if (i != 0 && i != 9999){
		moins.innerHTML = '<img src="img/delete.png">';
		moins.setAttribute("onclick", "del('"+selectedItem+"')");
	} else if (i == 9999){
		var option = document.createElement('option');
		option.text = max;
		select.appendChild(option);
		moins.innerHTML = '<img src="img/add.png">';
		moins.setAttribute("onclick", "add()");
	}
	div.appendChild(moins);
	div.appendChild(select);
	if (document.getElementById("more")){
		var more = document.getElementById("more");
		document.getElementById("container").insertBefore(div, more)
	}else{
		document.getElementById("container").appendChild(div);
	}
}

function showTimer(){
	document.getElementById("timer").style.display = "block";
}
function hideTimer(){
	document.getElementById("timer").style.display = "none";
}
function getInput(){
	return document.getElementById("input").innerText;	
}
function setInput(str){
	document.getElementById("input").innerText = str;
}
function setOutput(str){
	document.getElementById("output").innerText = str;
}
Storage.prototype.setObj = function(key, obj) {
	return this.setItem(key, JSON.stringify(obj))
}
Storage.prototype.getObj = function(key) {
	return JSON.parse(this.getItem(key));
}
