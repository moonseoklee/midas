
chrome.storage.sync.get(['engName','birthday','hobby','specialty'], function(result) {
    console.log('Value currently is ' + result.engName);
    document.querySelector('#englishName').value=result.engName;
    document.querySelector('#birthday').value=result.birthday;
    document.getElementsByName('#hobby').value=result.hobby;
    document.getElementsByName('#specialAbility').value=result.specialty;
});
