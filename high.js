
chrome.storage.local.get(['highSchool'], function(result) {

    let highSchoolName = result.highSchool;
    let t = []
    t.push(`<span>${highSchoolName}</span>`);
    t.push('<button type="button" class="resetSearchResult" data-button="resetSearchResult"></button>');

    $(document).find(`input[name$="highschool.academyName"]`).val(highSchoolName).next('span.searchResultName').html(t.join(''));


});
