const func = () => {

    chrome.tabs.executeScript({file:"test.js"})


}

const save = () =>{
    const {value : englishName} = inputEngName
    const {value : birthday} = inputBirth
    chrome.storage.sync.set({'engName': englishName,'birth':birthday}, function() {
        console.log('Value is set to ' + engName);
    });
}

const btn1 = document.getElementById('btn1');
const btn2 = document.getElementById('btn2');
const inputEngName = document.getElementById('engName');
const inputBirth = document.getElementById('birthday');
btn1.addEventListener("click",func);
btn2.addEventListener("click",save);


