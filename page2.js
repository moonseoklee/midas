
chrome.storage.local.get(['highSchoolStart','highSchoolEnd','highSchoolDay','highSchoolCategory','highSchool','highSchoolGraduate','highSchoolLoc'], function(result) {

    let highSchoolName = result.highSchool;
    let t = []
    t.push(`<span>${highSchoolName}</span>`);
    t.push('<button type="button" class="resetSearchResult" data-button="resetSearchResult"></button>');

    $(document).find(`input[name$="highschool.academyName"]`).val(highSchoolName).next('span.searchResultName').html(t.join(''));


    document.querySelectorAll('[name="highschool.graduationTypeCode"]')[(result.highSchoolGraduate)].checked=true;
    document.querySelectorAll('[name="highschool.locationCode"]')[0].value = result.highSchoolLoc;
    document.querySelectorAll('[name="highschool.highschoolCategoryCode"]')[0].value = result.highSchoolCategory;
    document.querySelectorAll('[name="highschool.dayOrNight"]')[result.highSchoolDay].checked=true;
    document.querySelectorAll('[name="highschool.entranceDate"]')[0].value=result.highSchoolStart.slice(0,4)+"."+result.highSchoolStart.slice(4,6);
    document.querySelectorAll('[name="highschool.graduationDate"]')[0].value=result.highSchoolEnd.slice(0,4)+"."+result.highSchoolEnd.slice(4,6);

});
