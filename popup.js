function func(){
    chrome.tabs.executeScript(null,
        {code:"document.querySelector('#englishName').value='떼걸룩'"});
}

function name(e){
    chrome.tabs.executeScript(null,
        {code:"console.log(e)"});
}

document.addEventListener('DOMContentLoaded',function () {
    var btn1 = document.querySelector('#btn1');
    btn1.addEventListener("click",func);

    var btn2 = document.querySelector('#btn2');
    var engName = document.getElementById("englishName");
    btn2.addEventListener("click",name(engName));
})