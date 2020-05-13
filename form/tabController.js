function tabController(cityName) {
    var i, tabcontent, tablinks;
    if(cityName=='page1'){
        default1()
    }else{
        default2()
    }
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(cityName).style.display = "block";

    //evt.currentTarget.className += " active";
}

const tab1 = document.getElementById('tab1');
const tab2 = document.getElementById('tab2');
const tab3 = document.getElementById('tab3');
tab1.addEventListener("click",()=>tabController('page1'));
tab2.addEventListener("click",()=>tabController('page2'));
tab3.addEventListener("click",()=>tabController('page3'));