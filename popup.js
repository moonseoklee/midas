const func = () => {

    chrome.tabs.executeScript({file:"test.js"})


}

const save = () =>{


    const englishName = inputLastname.value+" "+inputFirstname.value

    const birthday = inputBirth.value

    const {value : gender} = inputGender
    const {value : hobby} = inputHobby
    const {value : specialty} = inputSpecialty
    chrome.storage.sync.set({'engName': englishName,'birthday':birthday,'gender':gender,'hobby':hobby,'specialty':specialty}, function() {

    });
}

const btn1 = document.getElementById('btn1');
const btn2 = document.getElementById('btn2');
const inputLastname = document.getElementById('lastname');
const inputFirstname = document.getElementById('firstname');
const inputBirth = document.getElementById('birthday');
const inputGender = document.getElementById('gender');
const inputHobby = document.getElementById('hobby');
const inputSpecialty = document.getElementById('specialty');
const fullEngName = inputLastname+" "+inputFirstname;
btn1.addEventListener("click",func);
btn2.addEventListener("click",save);


