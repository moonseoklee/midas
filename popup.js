const func = () => {

    chrome.storage.sync.get(['engName'], function(result) {
        console.log('Value currently is ' + result.engName);
    });

    chrome.tabs.executeScript({file:"test.js"})


}

const name = () =>{
    const {value : englishName} = engName
    console.log(englishName)
    chrome.storage.sync.set({'engName': englishName}, function() {
        console.log('Value is set to ' + englishName);
    });
}

const btn1 = document.getElementById('btn1');
const btn2 = document.getElementById('btn2');
const engName = document.getElementById('engName');
btn1.addEventListener("click",func);
btn2.addEventListener("click",name);


