//declare the obj that will hold the selected text
var highlights={};
highlights.url  =window.location.href;
highlights.selections=[];

var color ;

chrome.storage.sync.get('Color', function (result)
{
    color = result.Color;
});


//listen to messages from popup.js
chrome.extension.onMessage.addListener(function(message, sender, sendResponse)
{
    switch(message.action)
    {
        case "highlight" :
        {
            highlight();
            break ;
        }
        case "save" :
        {
            save();
            break ;
        }

        case "get" :
        {
            get();
        }
    }
});

//gets the selected text saved in indexDB
function get(){
    var openRequest = indexedDB.open("highlightsDB",1);
    openRequest.onupgradeneeded = function(e) {
        var thisDB = e.target.result;
        //check if the store is created if not create it
        if(!thisDB.objectStoreNames.contains("highlights")) {
            thisDB.createObjectStore("highlights", { keyPath: "url" });
        }
    };
    openRequest.onsuccess = function(e) {
        db = e.target.result;
        var transaction = db.transaction(["highlights"], "readwrite");
        var store = transaction.objectStore("highlights");
        //get the objects that corresponds to the page url
        var request = store.get(highlights.url);
        request.onerror = function (e) {
            alert(e.target.error.name);
        };
        request.onsuccess = function (e) {
            reHighlight(e.target.result.selections);
        }
    };
    openRequest.onerror = function(e) {
        alert(e.target.error.name);
    };

}
//searches elements by their xPath and then it changes the color of the matching text
function reHighlight(selections) {
    for(var i = 0 ; i < selections.length ; i++)
    {
         // get the elements matching the xpath
         var xPathToElements = document.evaluate(selections[i].xPath , document , null ,  XPathResult.FIRST_ORDERED_NODE_TYPE , null);
         //replace the text that matches with a span tag containing the same text but colored
         xPathToElements.singleNodeValue.innerHTML = xPathToElements.singleNodeValue.innerHTML.replace(selections[i].text ,"<span  style='color: #feff71 '>"+selections[i].text+"</span>");
    }
}
//highlights the text selected by the user and add it to the highlights object
function highlight() {
    var selObj= window.getSelection();
    var highlightedText={};
    highlightedText.text =selObj.toString();
    highlightedText.xPath= getElementXPath();
    var range               = selObj.getRangeAt(0);
    var selectionContents   = range.extractContents();
    var span                = document.createElement("span");
    span.appendChild(selectionContents);
    span.style.backgroundColor  = color;
    span.style.color            = "white";
    range.insertNode(span);
    //add the selected text to the highlights object
    highlights.selections.push(highlightedText) ;
}

/*
* The functions :  getElementXPath() && getElementTreeXPath(element) are taken from the implementation of the firefox extension firebug .
*
 */

function getElementXPath()
{
    var element = window.getSelection().anchorNode.parentNode;
    if(element != null && element != undefined)
    {
        if (element && element.id)
          return '//*[@id="' + element.id + '"]'
        else
            return getElementTreeXPath(element);
    }

};


function getElementTreeXPath(element)
{
    var paths = [];

    // Use nodeName (instead of localName) so namespace prefix is included (if any).
    for (; element && element.nodeType == 1; element = element.parentNode)
    {
        var index = 0;
        for (var sibling = element.previousSibling; sibling; sibling = sibling.previousSibling)
        {
            // Ignore document type declaration.
            if (sibling.nodeType == Node.DOCUMENT_TYPE_NODE)
                continue;

            if (sibling.nodeName == element.nodeName)
                ++index;
        }

        var tagName = element.nodeName.toLowerCase();
        var pathIndex = (index ? "[" + (index + 1) + "]" : "");
        paths.splice(0, 0, tagName + pathIndex);
    }

    // Save the xpath
    var xpath = paths.length ? "/" + paths.join("/") : null;
    return xpath;
}


//saves the highlighted text in indexDB
function save(){
    var openRequest = indexedDB.open("highlightsDB",1);
    openRequest.onupgradeneeded = function(e) {
            var thisDB = e.target.result;
            if(!thisDB.objectStoreNames.contains("highlights")) {
                thisDB.createObjectStore("highlights", { keyPath: "url" });
            }
        };
    openRequest.onsuccess = function(e) {
        db = e.target.result;
        var transaction = db.transaction(["highlights"], "readwrite");
        var store = transaction.objectStore("highlights");
        //add the highlights obgect to the store
        var request = store.add(highlights);
        request.onerror = function (e) {
                if(e.target.error.name=='ConstraintError'){
                    /*
                    * if true than the object already exists
                    * in this case we get it from the indexDB
                    * then we add the newly selected text
                    * then we update the object
                    */
                    var transaction1 = db.transaction(["highlights"], "readonly");
                    var store1 = transaction1.objectStore("highlights");
                    //get the object from indexDB
                    var request1 = store1.get(highlights.url);
                    request1.onerror=function(e){
                        alert(e.target.error.name);
                    };
                    request1.onsuccess = function (e) {
                        var transaction = db.transaction(["highlights"], "readwrite");
                        var store = transaction.objectStore("highlights");
                        var sel= e.target.result;
                        for(var i=0;i<highlights.selections.length;i++){
                            sel.selections.push(highlights.selections[i]);
                        }
                    //update the object
                        var request = store.put(sel);
                        request.onerror = function (e) {
                            alert(e.target.error.name)
                        };
                        request.onsuccess= function (e) {
                            highlights.selections=[];
                        }
                    }
                }
            };
        request.onsuccess = function (e) {
                highlights.selections=[];
            }
        };
    openRequest.onerror = function(e) {
            alert(e.target.error.name);
        };
}
