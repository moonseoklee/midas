t.push(`<span>${nameValue}</span>`);
t.push('<button type="button" class="resetSearchResult" data-button="resetSearchResult"></button>');

$wrap.find('div.search.searched').removeClass('searched');
$(document).find(`input[name$="academyName"]`).val('백백').next('span.searchResultName').html(t.join(''));
