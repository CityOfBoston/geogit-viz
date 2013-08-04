// api.js
var selectClass = "exportapi";
var tablist = document.getElementById("apiselect").children;
for(var c=1;c<tablist.length;c++){
  tablist[c].children[0].onclick = function(e){
    var src = e.target || e.srcElement;
    var parent = src.parentNode || src.parentElement;
    var id = parent.id;
    if(id != selectClass){
      document.getElementById(selectClass).className = "";
      var lastSelected = document.getElementsByClassName(selectClass);
      for(var i=0;i<lastSelected.length;i++){
        lastSelected[i].style.display = "none";
      }
      selectClass = id;
      document.getElementById(selectClass).className = "active";
      var nowSelected = document.getElementsByClassName(selectClass);
      for(var i=0;i<nowSelected.length;i++){
        nowSelected[i].style.display = "block";
      }
    }
  }
}