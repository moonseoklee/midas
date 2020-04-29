
chrome.storage.local.get(['firstName','lastName','birthday','hobby','specialty','gender','army','armyWhere','armyPosition','armyStart','armyEnd','armyDischarge'], function(result) {

    var e = $.Event("keypress");
    e.which = 13;
    e.keyCode = 13;
    document.querySelectorAll('[data-type="highschool"]')[0].value="가수";

    $(document.querySelectorAll('[data-type="highschool"]')[0]).trigger(e);
    console.log("trig");


});
