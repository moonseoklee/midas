let btnSave1
let btnApply1
let inputLastname
let inputFirstname
let inputBirthM
let inputBirthD
let inputBirthY
let inputGender
let inputHobby
let inputSpecialty
let inputArmy
let inputArmyWhere
let inputArmyPosition
let inputArmyStart
let inputArmyEnd
let inputArmyDischarge
let btnSave2
let btnApply2
let inputHighSchool
let inputHighSchoolLoc
let inputHighSchoolCategory
let inputHighSchoolStart
let inputHighSchoolEnd
let inputUniversity
let inputUniversityLoc
let inputUniversityStart
let inputUniversityEnd
let btnSearchHighSchool

const func = () => {
    chrome.tabs.executeScript({file: "page1.js"})
}

const func2 = () => {
    chrome.tabs.executeScript({file: "jquery-min.js"}, function () {
        chrome.tabs.executeScript({file: "page2.js"})
    });
}


const save = () => {

    let armyDict = {"army1": 0, "army2": 1, "army3": 2, "army4": 3, "army5": 4};
//    let armyWhereDict= {"armyWhere1":'01',"armyWhere2":'02',"armyWhere3":'03',"armyWhere4":'04',"armyWhere5":'05',"armyWhere6":'06',"armyWhere7":'07',"armyWhere8":'08',"armyWhere9":'09',"armyWhere10":'10',"armyWhere11":'11',"armyWhere12":'99'};
    const lastName = inputLastname.value;
    const firstName = inputFirstname.value;
    const birthday = inputBirthY.value + inputBirthM.value + inputBirthD.value;
    const army = armyDict[inputArmy.value]
    const armyWhere = inputArmyWhere.value
    const armyPosition = inputArmyPosition.value
    const armyStart = inputArmyStart.value
    const armyEnd = inputArmyEnd.value
    const armyDischarge = inputArmyDischarge.value
    const {value: gender} = inputGender
    const {value: hobby} = inputHobby
    const {value: specialty} = inputSpecialty


    chrome.storage.local.set({
        'armyDischarge': armyDischarge,
        'armyStart': armyStart,
        'armyEnd': armyEnd,
        'armyPosition': armyPosition,
        'army': army,
        'armyWhere': armyWhere,
        'lastName': lastName,
        'firstName': firstName,
        'birthday': birthday,
        'gender': gender,
        'hobby': hobby,
        'specialty': specialty
    }, function () {

    });
    chrome.storage.local.set({'tab': 0})

}
const save2 = () => {

    const highSchool = inputHighSchool.value;

    const highSchoolGraduate = document.querySelector('[name = "highSchoolGraduate"]:checked').value;
    const highSchoolLoc = inputHighSchoolLoc.value;
    const highSchoolCategory = inputHighSchoolCategory.value;
    const highSchoolDay = document.querySelector('[name = "highSchoolDay"]:checked').value;
    const highSchoolStart = inputHighSchoolStart.value;
    const highSchoolEnd = inputHighSchoolEnd.value;


    const univDegreeType = document.querySelector('[name = "univDegreeType"]:checked').value;
    const university = inputUniversity.value;
    const universityLoc = inputUniversityLoc.value;
    const universityHeadOrBranch = document.querySelector('[name = "universityHeadOrBranch"]:checked').value;
    const universityStart = inputUniversityStart.value;
    const universityEnd = inputUniversityEnd.value;
    const universityEntranceType = document.querySelector('[name = "universityEntranceType"]:checked').value;

    chrome.storage.local.set({
        'university': university,
        'universityLoc': universityLoc,
        'univDegreeType': univDegreeType,
        'universityHeadOrBranch':universityHeadOrBranch,
        'universityStart':universityStart,
        'universityEnd':universityEnd,
        'universityEntranceType':universityEntranceType,

        'highSchoolDay': highSchoolDay,
        'highSchoolStart': highSchoolStart,
        'highSchoolEnd': highSchoolEnd,
        'highSchoolDay': highSchoolDay,
        'highSchoolCategory': highSchoolCategory,
        'highSchoolLoc': highSchoolLoc,
        'highSchool': highSchool,
        'highSchoolGraduate': highSchoolGraduate
    });
    chrome.storage.local.set({'tab': 1})
}

/*chrome.strage.local.get(['highSchoolDay','highSchoolStart','highSchoolEnd','highSchoolCategory','highSchool','highSchoolGraduate','armyPosition','armyDischarge','armyStart','armyEnd','lastName','firstName','birthday','hobby','specialty','gender','army','armyWhere'], function(result) {

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
    document.getElementById('highSchool').value=result.highSchool
    document.querySelectorAll('[name="highSchoolGraduate"]')[result.highSchoolGraduate].checked = true;


    //document.getElementById('highSchoolGraduate').value=result.highSchoolGraduate
    document.getElementById('highSchoolCategory').value=result.highSchoolCategory

    document.getElementById('highSchoolStart').value=result.highSchoolStart
    document.getElementById('highSchoolEnd').value=result.highSchoolEnd
    document.querySelectorAll('[name="highSchoolDay"]')[result.highSchoolDay].checked = true;



});*/

const default1 = () => {
    btnSave1 = document.getElementById('btnSave1');
    btnApply1 = document.getElementById('btnApply1');

    inputLastname = document.getElementById('lastname');
    inputFirstname = document.getElementById('firstname');
    inputBirthM = document.getElementById('birthday1');
    inputBirthD = document.getElementById('birthday2');
    inputBirthY = document.getElementById('birthday3');
    inputGender = document.getElementById('gender');
    inputHobby = document.getElementById('hobby');
    inputSpecialty = document.getElementById('specialty');
    inputArmy = document.getElementById('army');
    inputArmyWhere = document.getElementById('armyWhere');
    inputArmyPosition = document.getElementById('armyPosition');
    inputArmyStart = document.getElementById('armyStart');
    inputArmyEnd = document.getElementById('armyEnd');
    inputArmyDischarge = document.getElementById('armyDischarge');
    btnSave1.addEventListener("click", save);
    btnApply1.addEventListener("click", func);
    chrome.storage.local.get(['highSchoolDay', 'highSchoolStart', 'highSchoolEnd', 'highSchoolCategory', 'highSchool', 'highSchoolGraduate', 'armyPosition', 'armyDischarge', 'armyStart', 'armyEnd', 'lastName', 'firstName', 'birthday', 'hobby', 'specialty', 'gender', 'army', 'armyWhere'], function (result) {

        document.getElementById('lastname').value = result.lastName;
        document.getElementById('firstname').value = result.firstName;
        document.getElementById('birthday1').value = result.birthday.slice(4, 6);
        document.getElementById('birthday2').value = result.birthday.slice(6, 8);
        document.getElementById('birthday3').value = result.birthday.slice(0, 4);

        document.getElementById('hobby').value = result.hobby;
        document.getElementById('specialty').value = result.specialty;
        document.getElementById('army').value = result.army;
        if (result.gender == "Male") {
            document.getElementById('gender').value = 'Male'
        } else {
            document.getElementById('gender').value = 'Female'
        }

        document.getElementById('army').value = 'army' + (result.army + 1).toString()
        document.getElementById('armyWhere').value = result.armyWhere
        document.getElementById('armyPosition').value = result.armyPosition
        document.getElementById('armyStart').value = result.armyStart
        document.getElementById('armyEnd').value = result.armyEnd
        document.getElementById('armyDischarge').value = result.armyDischarge


    });


//let inputHighSchoolGraduate = document.querySelector('input[name = "highschool.graduationTypeCode"]:checked');
};
const default2 = () => {


    //고등학교
    inputHighSchool = document.getElementById('highSchool');
    inputHighSchoolLoc = document.getElementById('highSchoolLoc');
    inputHighSchoolCategory = document.getElementById('highSchoolCategory');
    inputHighSchoolStart = document.getElementById('highSchoolStart');
    inputHighSchoolEnd = document.getElementById('highSchoolEnd');

    //대학교
    inputUniversity = document.getElementById('university');
    inputUniversityLoc = document.getElementById('universityLoc');
    inputUniversityStart = document.getElementById('universityStart')
    inputUniversityEnd= document.getElementById('universityEnd')

    btnSearchHighSchool = document.getElementById('searchHighSchool');
    btnSearchHighSchool.addEventListener("click",searchHighSchool);

    btnSave2 = document.getElementById('btnSave2');
    btnApply2 = document.getElementById('btnApply2');
    btnSave2.addEventListener("click", save2);
    btnApply2.addEventListener("click", func2);

    chrome.storage.local.get(['universityEntranceType','universityStart','universityEnd','universityHeadOrBranch','universityLoc','university', 'univDegreeType', 'highSchoolLoc', 'highSchoolDay', 'highSchoolStart', 'highSchoolEnd', 'highSchoolCategory', 'highSchool', 'highSchoolGraduate', 'armyPosition', 'armyDischarge', 'armyStart', 'armyEnd', 'lastName', 'firstName', 'birthday', 'hobby', 'specialty', 'gender', 'army', 'armyWhere'], function (result) {

        //document.getElementById('highSchool').value = result.highSchool
        document.querySelectorAll('[name="highSchoolGraduate"]')[result.highSchoolGraduate].checked = true;
        //document.getElementById('highSchoolGraduate').value=result.highSchoolGraduate
        document.getElementById('highSchoolCategory').value = result.highSchoolCategory
        document.getElementById('highSchoolStart').value = result.highSchoolStart
        document.getElementById('highSchoolEnd').value = result.highSchoolEnd
        document.getElementById('highSchoolLoc').value = result.highSchoolLoc
        document.querySelectorAll('[name="highSchoolDay"]')[result.highSchoolDay].checked = true;


        document.querySelectorAll('[name="univDegreeType"]')[result.univDegreeType].checked = true;
        document.getElementById('university').value = result.university
        document.getElementById('universityLoc').value = result.universityLoc
        document.querySelectorAll('[name="universityHeadOrBranch"]')[result.universityHeadOrBranch].checked = true;
        document.querySelectorAll('[name="universityEntranceType"]')[result.universityEntranceType].checked = true;
        document.getElementById('universityStart').value = result.universityStart
        document.getElementById('universityEnd').value = result.universityEnd

    });

//let inputHighSchoolGraduate = document.querySelector('input[name = "highschool.graduationTypeCode"]:checked');
};



const searchHighSchool = () => {
    let searchedHighSchool = document.getElementById('searchedHighSchool').value;
    let markName;
    let param = {};
    let t=[];
    param.highschoolName = searchedHighSchool;
    $.ajax({
        type: 'post', dataType: 'json',
        url: 'https://prudential.recruiter.co.kr/com/code/retrieveHighschoolList',
        data: param,
        async : false
    })
        .done(function(x,e){
            for(let i=0; i<x.length; i++) {
                //name 과 code외에 따로 넘겨야할 값들 (data-attribute형식)


                markName = x[i]['highschoolName'].replace(searchedHighSchool, `<strong>${searchedHighSchool}</strong>`);
                t.push(`<li><button type="button" class="ellipsis" data-code="${x[i]['highschoolCode']}" title="${x[i]['highschoolName']}" >${markName}</button></li>`);
            }

            $('#searchedHighSchools').html(`<ul class="searchResultList">${t.join('')}</ul>`);
        })
}





