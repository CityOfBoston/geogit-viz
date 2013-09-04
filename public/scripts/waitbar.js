if(typeof console == "undefined"){
  console = { log: function(e){ } };
}

setInterval(function(){
  $.getJSON("/" + (port*1) + "/geogit/log?output=json", function(data){
    if(typeof data.response != "undefined"){
      window.location = "/map/" + (port*1);
    }
  }, function(data){
    console.log('waiting');
  });
}, 4000);
