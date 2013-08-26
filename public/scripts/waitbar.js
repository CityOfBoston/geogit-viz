if(typeof console == "undefined"){
  console = { log: function(e){ } };
}

setInterval(function(){
  $.getJSON("/" + (port*1) + "/geogit/log?output=json", function(data){
    window.location = "/git/" + (port*1);
  }, function(data){
    console.log('waiting');
  });
}, 4000);