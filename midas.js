


$wrap.find('div.search.searched').removeClass('searched');
$(document).find(`input[name$="academyName"]`).val('백백').next('span.searchResultName').html(t.join(''));


let t = []
t.push(`<span>${highSchoolName}</span>`);
t.push('<button type="button" class="resetSearchResult" data-button="resetSearchResult"></button>');

$(document).find(`input[name$="highschool.academyName"]`).val(highSchoolName).next('span.searchResultName').html(t.join(''));

