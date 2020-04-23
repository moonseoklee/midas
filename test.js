
chrome.storage.sync.get(['engName','birth'], function(result) {
    console.log('Value currently is ' + result.engName);
    document.querySelector('#englishName').value=result.engName;
    document.querySelector('#birthday').value=result.birth;
});
