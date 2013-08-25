function addRepo(){
  $.post("/addrepo", { user: $("#userinfo").val(), project: $("#projectinfo").val() }, function(data){
    console.log(data);
    if(typeof data.error != "undefined"){
      alert("Error: " + data.error);
    }
    else if(typeof data.port != "undefined"){
      alert("Available at geoginger.com/git/" + data.port);
    }
  });
}