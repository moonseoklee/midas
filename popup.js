const func = () => {
    chrome.tabs.executeScript({file:"storage.js"})
}


const func2 = () => {
    chrome.tabs.executeScript({file: "jquery-min.js"}, function(){
        chrome.tabs.executeScript({file:"high.js"})
    });
}



const save = () =>{

    let armyDict = {"army1":0,"army2":1,"army3":2,"army4":3,"army5":4};
//    let armyWhereDict= {"armyWhere1":'01',"armyWhere2":'02',"armyWhere3":'03',"armyWhere4":'04',"armyWhere5":'05',"armyWhere6":'06',"armyWhere7":'07',"armyWhere8":'08',"armyWhere9":'09',"armyWhere10":'10',"armyWhere11":'11',"armyWhere12":'99'};
    const lastName = inputLastname.value;
    const firstName = inputFirstname.value;
    const birthday = inputBirth.value
    const army = armyDict[inputArmy.value]
    const armyWhere = inputArmyWhere.value
    const armyPosition = inputArmyPosition.value
    const armyStart = inputArmyStart.value
    const armyEnd = inputArmyEnd.value
    const armyDischarge = inputArmyDischarge.value
    const {value : gender} = inputGender
    const {value : hobby} = inputHobby
    const {value : specialty} = inputSpecialty


    chrome.storage.local.set({'armyDischarge':armyDischarge,'armyStart':armyStart,'armyEnd':armyEnd,'armyPosition':armyPosition,'army':army ,'armyWhere':armyWhere, 'lastName': lastName,'firstName':firstName,'birthday':birthday,'gender':gender,'hobby':hobby,'specialty':specialty}, function() {

    });
}
const save2=()=> {

    const highSchool = inputHighSchool.value;

    const highSchoolGraduate = document.querySelector('input[name = "highschool.graduationTypeCode"]:checked').value;
    const highSchoolLoc = inputHighSchoolLoc.value;

    chrome.storage.local.set({'highSchoolLoc' : highSchoolLoc, 'highSchool':highSchool,'highSchoolGraduate': highSchoolGraduate});
}

chrome.storage.local.get(['highSchool','highSchoolGraduate','armyPosition','armyDischarge','armyStart','armyEnd','lastName','firstName','birthday','hobby','specialty','gender','army','armyWhere'], function(result) {

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

    document.getElementById('army').value='army'+(result.army+1).toString()
    document.getElementById('armyWhere').value=result.armyWhere
    document.getElementById('armyPosition').value=result.armyPosition
    document.getElementById('armyStart').value=result.armyStart
    document.getElementById('armyEnd').value=result.armyEnd
    document.getElementById('armyDischarge').value=result.armyDischarge
    document.getElementById('highSchool').value=result.highSchool
    document.getElementById('highSchoolGraduate').value=result.highSchoolGraduate



});
const btn1 = document.getElementById('btn1');
const btn2 = document.getElementById('btn2');
const btn3 = document.getElementById('btn3');
const btn4 = document.getElementById('btn4');
const inputLastname = document.getElementById('lastname');
const inputFirstname = document.getElementById('firstname');
const inputBirth = document.getElementById('birthday');
const inputGender = document.getElementById('gender');
const inputHobby = document.getElementById('hobby');
const inputSpecialty = document.getElementById('specialty');
const inputArmy = document.getElementById('army');
const inputArmyWhere = document.getElementById('armyWhere');
const inputArmyPosition = document.getElementById('armyPosition');
const inputArmyStart = document.getElementById('armyStart');
const inputArmyEnd = document.getElementById('armyEnd');
const inputArmyDischarge = document.getElementById('armyDischarge');
const inputHighSchool = document.getElementById('highSchool');
const inputHighSchoolLoc = document.getElementById('highSchoolLog');

let inputHighSchoolGraduate = document.querySelector('input[name = "highschool.graduationTypeCode"]:checked');



btn1.addEventListener("click",func);
btn2.addEventListener("click",save);

btn3.addEventListener("click",save2);
btn4.addEventListener("click",func2);



