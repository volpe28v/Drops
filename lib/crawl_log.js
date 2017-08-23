var mongo = require('mongodb');
var db;
var table_blog_name = 'crawl_log';

var LOG_LIMIT = 50;

module.exports.set_db = function(current_db){
  db = current_db;
};

module.exports.save = function(log) {
  return new Promise(function(resolve, reject){
    db.collection(table_blog_name, function(err, collection) {
      collection.save( log, function(){
        resolve(log);
      });
    });
  });
};

module.exports.find = function(){
  return new Promise(function(resolve){
    db.collection(table_blog_name, function(err, collection) {
      collection.find({}, {limit: LOG_LIMIT, sort: {date: -1}}).toArray(function(err, latest_logs) {
        resolve({logs: latest_logs});
      });
    });
  });
};

module.exports.find_older = function(last_id){
  return new Promise(function(resolve){
    db.collection(table_blog_name, function(err, collection) {
      collection.findOne({_id: new mongo.ObjectID(last_id)}, function(err, last_log){
        collection.find({ date: {$lt: last_log.date}}, {limit: BLOG_LIMIT + 1, sort:{date: -1}}).toArray(function(err, logs) {
          resolve(logs);
        });
      });
    });
  });
};

