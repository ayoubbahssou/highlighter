document.addEventListener('DOMContentLoaded', function(){

        var highlighter=document.getElementById('highlighter');
        var saver      =document.getElementById('saver');
        var getter     =document.getElementById('getter');
        highlighter.addEventListener('click',function(){
            call('highlight');
        });
        saver.addEventListener('click',function(){
            call('save');
        });
        getter.addEventListener('click', function(){
            call('get');
        });
});
//sneds a message containing the action performed by the user
var call = function(action)
{
    var message={};
    message.action=action;
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs)
        {
            chrome.tabs.sendMessage(tabs[0].id, message) ;
        }
    );
};