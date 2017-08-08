var mongo = require('mongodb');

module.exports.ready = function(db_name){
  return new Promise(function(resolve,reject){
    if ( process.env.MONGOLAB_URI ){
      mongo.connect(process.env.MONGOLAB_URI, {}, function(error, db){
        console.log("mongodb connected to " + process.env.MONGOLAB_URI);
        resolve(db);
      });
    }else{
      new mongo.Db(db_name, new mongo.Server('127.0.0.1', 27017, {}), {safe:true}).open(function(err,db){
        console.log("mongodb connected to localhost");
        resolve(db);
      });
    }
  });
};

