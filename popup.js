const func = () => {
    chrome.tabs.executeScript({file:"page1.js"})
}


const func2 = () => {
    chrome.tabs.executeScript({file: "jquery-min.js"}, function(){
        chrome.tabs.executeScript({file:"page2.js"})
    });
}



const save = () =>{

    let armyDict = {"army1":0,"army2":1,"army3":2,"army4":3,"army5":4};
//    let armyWhereDict= {"armyWhere1":'01',"armyWhere2":'02',"armyWhere3":'03',"armyWhere4":'04',"armyWhere5":'05',"armyWhere6":'06',"armyWhere7":'07',"armyWhere8":'08',"armyWhere9":'09',"armyWhere10":'10',"armyWhere11":'11',"armyWhere12":'99'};
    const lastName = inputLastname.value;
    const firstName = inputFirstname.value;
    const birthday = inputBirthY.value+inputBirthM.value+inputBirthD.value;
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
    console.log('tabc on')
    tabController('page1');
}
const save2=()=> {

    const highSchool = inputHighSchool.value;

    const highSchoolGraduate = document.querySelector('[name = "highSchoolGraduate"]:checked').value;
    const highSchoolLoc = inputHighSchoolLoc.value;
    const highSchoolCategory = inputHighSchoolCategory.value;
    const highSchoolDay = document.querySelector('[name = "highSchoolDay"]:checked').value;
    const highSchoolStart = inputHighSchoolStart.value;
    const highSchoolEnd = inputHighSchoolEnd.value;
    chrome.storage.local.set({'highSchoolDay':highSchoolDay,'highSchoolStart':highSchoolStart,'highSchoolEnd':highSchoolEnd,'highSchoolDay':highSchoolDay,'highSchoolCategory':highSchoolCategory,'highSchoolLoc' : highSchoolLoc, 'highSchool':highSchool,'highSchoolGraduate': highSchoolGraduate});
}

chrome.storage.local.get(['highSchoolDay','highSchoolStart','highSchoolEnd','highSchoolCategory','highSchool','highSchoolGraduate','armyPosition','armyDischarge','armyStart','armyEnd','lastName','firstName','birthday','hobby','specialty','gender','army','armyWhere'], function(result) {

    document.getElementById('lastname').value=result.lastName;
    document.getElementById('firstname').value=result.firstName;
    document.getElementById('birthday1').value=result.birthday.slice(4,6);
    document.getElementById('birthday2').value=result.birthday.slice(6,8);
    document.getElementById('birthday3').value=result.birthday.slice(0,4);

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
    /*document.getElementById('highSchool').value=result.highSchool
    document.querySelectorAll('[name="highSchoolGraduate"]')[result.highSchoolGraduate].checked = true;


    //document.getElementById('highSchoolGraduate').value=result.highSchoolGraduate
    document.getElementById('highSchoolCategory').value=result.highSchoolCategory
    console.log(result.highSchoolStart);
    document.getElementById('highSchoolStart').value=result.highSchoolStart
    document.getElementById('highSchoolEnd').value=result.highSchoolEnd
    document.querySelectorAll('[name="highSchoolDay"]')[result.highSchoolDay].checked = true;*/



});
const btn1 = document.getElementById('btn1');
const btn2 = document.getElementById('btn2');
const btn3 = document.getElementById('btn3');
const btn4 = document.getElementById('btn4');
const inputLastname = document.getElementById('lastname');
const inputFirstname = document.getElementById('firstname');
const inputBirthM = document.getElementById('birthday1');
const inputBirthD = document.getElementById('birthday2');
const inputBirthY = document.getElementById('birthday3');
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
const inputHighSchoolLoc = document.getElementById('highSchoolLoc');
const inputHighSchoolCategory = document.getElementById('highSchoolCategory');
const inputHighSchoolStart = document.getElementById('highSchoolStart');
const inputHighSchoolEnd = document.getElementById('highSchoolEnd');
//let inputHighSchoolGraduate = document.querySelector('input[name = "highschool.graduationTypeCode"]:checked');



btn1.addEventListener("click",func);
btn2.addEventListener("click",save);

//btn3.addEventListener("click",save2);
//btn4.addEventListener("click",func2);



