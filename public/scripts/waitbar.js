if(typeof console == "undefined"){
  console = { log: function(e){ } };
}

setInterval(function(){
  $.getJSON("/" + (port*1) + "/geogit/log?output=json", function(data){
    if(typeof data.response != "undefined"){
      if(typeof source != "undefined" && source && (source == "GitHub" || source == "user")){
        window.location = "/git/" + (port*1);
      }
      else{
        window.location = "/map/" + (port*1);      
      }
    }
  }, function(data){
    console.log('waiting');
  });
}, 4000);
