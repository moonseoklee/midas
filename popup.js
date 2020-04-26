const func = () => {

    chrome.tabs.executeScript({file:"storage.js"})


}

const save = () =>{

    let armyDict = {"army1":0,"army2":1,"army3":2,"army4":3,"army5":4};

    const lastName = inputLastname.value;
    const firstName = inputFirstname.value;
    const birthday = inputBirth.value
    const army = armyDict[inputArmy.value]

    const {value : gender} = inputGender
    const {value : hobby} = inputHobby
    const {value : specialty} = inputSpecialty
    chrome.storage.local.set({'army':army , 'lastName': lastName,'firstName':firstName,'birthday':birthday,'gender':gender,'hobby':hobby,'specialty':specialty}, function() {

    });
}
chrome.storage.local.get(['lastName','firstName','birthday','hobby','specialty','gender','army'], function(result) {

    document.getElementById('lastname').value=result.lastName;
    document.getElementById('firstname').value=result.firstName;
    document.getElementById('birthday').value=result.birthday;

    document.getElementById('hobby').value=result.hobby;
    document.getElementById('specialty').value=result.specialty;
    document.getElementById('army').value=result.army;
    if(result.gender=="Male"){
        document.getElementById('gender').value='Male'
    }else{
        document.getElementById('gender').value='Female'
    }
    console.log(result.army)
    document.getElementById('army').value='army'+(result.army+1).toString()


});
const btn1 = document.getElementById('btn1');
const btn2 = document.getElementById('btn2');
const inputLastname = document.getElementById('lastname');
const inputFirstname = document.getElementById('firstname');
const inputBirth = document.getElementById('birthday');
const inputGender = document.getElementById('gender');
const inputHobby = document.getElementById('hobby');
const inputSpecialty = document.getElementById('specialty');
const inputArmy = document.getElementById('army');
btn1.addEventListener("click",func);
btn2.addEventListener("click",save);


