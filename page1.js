chrome.storage.local.get(['firstName','lastName','birthday','hobby','specialty','gender','army','armyWhere','armyPosition','armyStart','armyEnd','armyDischarge'], function(result) {

    if(document.querySelector('#englishName')!=null){

        document.querySelector('#englishName').value=result.lastName+" "+result.firstName;
    }
    if(document.querySelector('#birthday')!=null){
    document.querySelector('#birthday').value=result.birthday.slice(0,4)+"."+result.birthday.slice(4,6)+"."+result.birthday.slice(6,8);}
    if(document.querySelectorAll('[name="hobby"]')[0]!=null){
    document.querySelectorAll('[name="hobby"]')[0].value=result.hobby;}
    if( document.querySelectorAll('[name="specialAbility"]')[0]!=null){
    document.querySelectorAll('[name="specialAbility"]')[0].value=result.specialty;}
    if(document.querySelectorAll('[name="genderFlag"]')[0]!=null) {
        if (result.gender == 'Male') {
            document.querySelectorAll('[name="genderFlag"]')[0].checked = true;
        } else {
            document.querySelectorAll('[name="genderFlag"]')[1].checked = true;
        }
    }
    if(document.querySelectorAll('[name="military.militaryTypeCode"]')[result.army]!=null){
    document.querySelectorAll('[name="military.militaryTypeCode"]')[result.army].checked=true;}
    if(document.getElementById('militaryBranchCode')!=null){
    document.getElementById('militaryBranchCode').value=result.armyWhere;}
    if( document.querySelectorAll('[name="military.militaryPositionCode"]')[0]!=null){
    document.querySelectorAll('[name="military.militaryPositionCode"]')[0].value=result.armyPosition;}
    if( document.querySelectorAll('[name="military.militaryStartDate"]')[0]!=null){
    document.querySelectorAll('[name="military.militaryStartDate"]')[0].value=result.armyStart.slice(0,4)+"."+result.armyStart.slice(4,6)+"."+result.armyStart.slice(6,8);}
    if(document.querySelectorAll('[name="military.militaryEndDate"]')[0]!=null){
    document.querySelectorAll('[name="military.militaryEndDate"]')[0].value=result.armyEnd.slice(0,4)+"."+result.armyEnd.slice(4,6)+"."+result.armyEnd.slice(6,8);}
    if(document.querySelectorAll('[name="military.militaryDischargeCode"]')[0]!=null){
    document.querySelectorAll('[name="military.militaryDischargeCode"]')[0].value=result.armyDischarge;}



});
