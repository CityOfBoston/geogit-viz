module.exports = function(mongoose){
  var collection = 'repos';
  var Schema = mongoose.Schema;
  var ObjectId = Schema.ObjectId;

  var schema = new Schema({
    user: String,
    project: String,
    suffix: String,
    port: String,
    src: String,
    pushupdate: Boolean,
    coords: [ ],
    json: String
  });

  return mongoose.model(collection, schema);
};
