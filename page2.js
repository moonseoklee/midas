
chrome.storage.local.get(['univDegreeType','highSchoolStart','highSchoolEnd','highSchoolDay','highSchoolCategory','highSchool','highSchoolGraduate','highSchoolLoc'], function(result) {

    let highSchoolName = result.highSchool;
    let t = []
    t.push(`<span>${highSchoolName}</span>`);
    t.push('<button type="button" class="resetSearchResult" data-button="resetSearchResult"></button>');

    if($(document).find(`input[name$="highschool.academyName"]`)!=null){
    $(document).find(`input[name$="highschool.academyName"]`).val(highSchoolName).next('span.searchResultName').html(t.join(''));}


    if(document.querySelectorAll('[name="highschool.graduationTypeCode"]')[(result.highSchoolGraduate)]!=null){
    document.querySelectorAll('[name="highschool.graduationTypeCode"]')[(result.highSchoolGraduate)].checked=true;}
    if(document.querySelectorAll('[name="highschool.locationCode"]')[0]!=null){
    document.querySelectorAll('[name="highschool.locationCode"]')[0].value = result.highSchoolLoc;}
    if(document.querySelectorAll('[name="highschool.highschoolCategoryCode"]')[0].value!=null){
    document.querySelectorAll('[name="highschool.highschoolCategoryCode"]')[0].value = result.highSchoolCategory;}
    if(document.querySelectorAll('[name="highschool.dayOrNight"]')[result.highSchoolDay]!=null){
    document.querySelectorAll('[name="highschool.dayOrNight"]')[result.highSchoolDay].checked=true;}
    if(document.querySelectorAll('[name="highschool.entranceDate"]')[0]!=null){
    document.querySelectorAll('[name="highschool.entranceDate"]')[0].value=result.highSchoolStart.slice(0,4)+"."+result.highSchoolStart.slice(4,6);}

    if(document.querySelectorAll('[name="highschool.graduationDate"]')[0]!=null){
    document.querySelectorAll('[name="highschool.graduationDate"]')[0].value=result.highSchoolEnd.slice(0,4)+"."+result.highSchoolEnd.slice(4,6);}


    if(document.querySelectorAll('[name="univDegreeType"]')[(result.univDegreeType)]!=null){
        document.querySelectorAll('[name="univDegreeType"]')[(result.univDegreeType)].checked=true;}
});
