
chrome.storage.local.get(['firstName','lastName','birthday','hobby','specialty','gender','army','armyWhere','armyPosition','armyStart','armyEnd','armyDischarge'], function(result) {

    document.querySelector('#englishName').value=result.lastName+" "+result.firstName;
    document.querySelector('#birthday').value=result.birthday.slice(0,4)+"."+result.birthday.slice(4,6)+"."+result.birthday.slice(6,8);
    document.querySelectorAll('[name="hobby"]')[0].value=result.hobby;
    document.querySelectorAll('[name="specialAbility"]')[0].value=result.specialty;

    if(result.gender=='남'){
        document.querySelectorAll('[name="genderFlag"]')[0].checked=true;
    }else{
        document.querySelectorAll('[name="genderFlag"]')[1].checked=true;
    }
    document.querySelectorAll('[name="military.militaryTypeCode"]')[result.army].checked=true;
    document.getElementById('militaryBranchCode').value=result.armyWhere;
    document.querySelectorAll('[name="military.militaryPositionCode"]')[0].value=result.armyPosition;
    document.querySelectorAll('[name="military.militaryStartDate"]')[0].value=result.armyStart.slice(0,4)+"."+result.armyStart.slice(4,6)+"."+result.armyStart.slice(6,8);
    document.querySelectorAll('[name="military.militaryEndDate"]')[0].value=result.armyEnd.slice(0,4)+"."+result.armyEnd.slice(4,6)+"."+result.armyEnd.slice(6,8);
    document.querySelectorAll('[name="military.militaryDischargeCode"]')[0].value=result.armyDischarge;



});
