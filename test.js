
chrome.storage.sync.get(['engName','birthday','hobby','specialty','gender'], function(result) {
    console.log('Value currently is ' + result.engName);
    document.querySelector('#englishName').value=result.engName;
    document.querySelector('#birthday').value=result.birthday;
    document.querySelectorAll('[name="hobby"]')[0].value=result.hobby;
    document.querySelectorAll('[name="specialAbility"]')[0].value=result.specialty;

    if(result.gender=='남'){
        document.querySelectorAll('[name="genderFlag"]')[0].checked=true;
    }else{
        document.querySelectorAll('[name="genderFlag"]')[1].checked=true;
    }



});
