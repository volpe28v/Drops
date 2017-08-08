var mongo = require('mongodb');
var db;
var table_name = 'drops';

module.exports.set_db = function(current_db){
  db = current_db;
};

// 全件保存
module.exports.save = function(data) {
  console.log("save");
  console.log(data);
  return new Promise(function(resolve, reject){
    Promise.resolve()
      .then(function(result){
        return deleteAll();
      })
      .then(function(result){
        return saveAll(data);
      })
      .then(function(){
        resolve();
      });
  });
}

// 全件取得
module.exports.get = function(){
  return new Promise(function(resolve,reject){
    db.collection(table_name, function(err, collection) {
      collection.findOne({}, function(err, data){
        resolve(data);
      });
    });
  });
};

function saveAll(data) {
  console.log("saveAll");
  return new Promise(function(resolve,reject){
    db.collection(table_name, function(err, collection) {
      collection.save( data, function(){
        resolve(data);
      });
    });
  });
};

// 全件削除
function deleteAll() {
  return new Promise(function(resolve,reject){
    db.collection(table_name, function(err, collection) {
      collection.remove( {} ,{safe:true}, function(){
        resolve();
      });
    });
  });
};


