chrome.storage.local.get(['universityLoc','universityHeadOrBranch','university','univDegreeType','highSchoolStart','highSchoolEnd','highSchoolDay','highSchoolCategory','highSchool','highSchoolGraduate','highSchoolLoc'], function(result) {

    let highSchoolName = result.highSchool;
    let universityName = result.university;
    let t = []
    let t2 = []
    t.push(`<span>${highSchoolName}</span>`);
    t.push('<button type="button" class="resetSearchResult" data-button="resetSearchResult"></button>');

    t2.push(`<span>${universityName}</span>`);
    t2.push('<button type="button" class="resetSearchResult" data-button="resetSearchResult"></button>');

    if($(document).find(`input[name$="highschool.academyName"]`)!=null){
    $(document).find(`input[name$="highschool.academyName"]`).val(universityName).next('span.searchResultName').html(t.join(''));}
    if($(document).find(`input[name$="college[0].academyName"]`)!=null){
        $(document).find(`input[name$="college[0].academyName"]`).val(universityName).next('span.searchResultName').html(t2.join(''));}

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



    if(document.querySelectorAll('[name="college[0].degreeTypeCode"]')[(result.univDegreeType)]!=null){
        document.querySelectorAll('[name="college[0].degreeTypeCode"]')[(result.univDegreeType)].checked=true;}
    if(document.querySelectorAll('[name="college[0].locationCode"]')[0]!=null){
        document.querySelectorAll('[name="college[0].locationCode"]')[0].value = result.universityLoc;}
    if(document.querySelectorAll('[name="college[0].headOrBranch"]')[result.universityHeadOrBranch]!=null){
        document.querySelectorAll('[name="college[0].headOrBranch"]')[result.universityHeadOrBranch].checked=true;}
});
