
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);


// Saves options to chrome.storage
function save_options()
{
    var color = document.getElementById('color').value;

    chrome.storage.sync.set({'Color': color}, function ()
    {
        alert("Color Saved ! ")
    });
}


// Restores select box stored in chrome.storage.

function restore_options() {
    // Use default value color = 'red'
    chrome.storage.sync.get(
    {
        Color: 'red',
    }, function(items)
    {
        document.getElementById('color').value = items.Color;
    });
}
