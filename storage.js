
chrome.storage.local.get(['firstName','lastName','birthday','hobby','specialty','gender','army'], function(result) {

    document.querySelector('#englishName').value=result.lastName+" "+result.firstName;
    document.querySelector('#birthday').value=result.birthday;
    document.querySelectorAll('[name="hobby"]')[0].value=result.hobby;
    document.querySelectorAll('[name="specialAbility"]')[0].value=result.specialty;

    if(result.gender=='남'){
        document.querySelectorAll('[name="genderFlag"]')[0].checked=true;
    }else{
        document.querySelectorAll('[name="genderFlag"]')[1].checked=true;
    }
    document.querySelectorAll('[name="military.militaryTypeCode"]')[result.army].checked=true;





});
