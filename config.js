module.exports = function(app, express){

  var config = this;

  app.requireAuth = false;

  //generic config
  app.configure(function(){
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({ secret: process.env.SECRETKEY }));
    app.use(express.compress());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
  });

  //env specific config
  app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  });

  app.configure('production', function(){
    app.use(express.errorHandler());
  });

  return config;

};
