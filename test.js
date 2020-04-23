
chrome.storage.sync.get(['engName'], function(result) {
    console.log('Value currently is ' + result.engName);
    document.querySelector('#englishName').value=result.engName;
});
