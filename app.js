var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();
var path = require('path');
var program = require('commander');
var moment = require('moment');

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

var program = require('commander');
program
  .version('1.0.0')
  .option('-i, --init <n>', 'initial count. default is 300.')
  .option('-r, --reload <n>', 'reload count. default is 100.')
  .option('-d, --db_name [name]', 'db name. default is "drops_db".')
  .option('-p, --port <n>', 'port no. default is 3000.')
  .parse(process.argv);

app.set('port', program.port || process.env.PORT || 3000);
app.set('init', program.init || process.env.INIT || 300);
app.set('reload', program.reload || process.env.RELOAD || 100);
app.set('db_name', program.db_name || 'drops_db');

var Drop = require("./lib/drop");
var mongo_builder = require('./lib/mongo_builder');
var drop_db = require("./lib/drops_db");

var latestCrawlDate = moment();

Promise.all([
  mongo_builder.ready(app.get('db_name'))
])
.then(function(results){
  drop_db.set_db(results[0]);
  startServer();
});

function startServer(){
  app.get('/', function (req, res) {
    var options = { root: path.join(__dirname, '') };
    res.sendFile('index.html', options);
  });

  app.get('/init', function (req, res){
    console.log(req.url);

    var addCount = 0;
    Promise.resolve()
    .then(function(result){
      return Drop.getUpdatedList([], app.get('init'));
    })
    .then(function(result){
      var updatedList = result;
      latestCrawlDate = moment();

      addCount = updatedList.length;
      return drop_db.save({data: updatedList});
    })
    .then(function(){
      res.send({
        latestCrawlDate: latestCrawlDate.format('YYYY/MM/DD HH:mm'),
        updated: addCount 
      });
    });
  });

  app.post('/search', function (req, res){
    console.log(req.url);
    console.log(req.body);
    var query = req.body.query;
    var queries = query.split(',');

    Promise.resolve()
    .then(function(){
      return drop_db.get();
    })
    .then(function(result){
      var alertList = result != null ? result.data : [];

      var hitList = [];
      if (queries.length == 1 && queries[0] == ""){
        hitList = alertList;
      }else{
        hitList = alertList.filter(function(al){
          var found = false;
          queries.forEach(function(q){
            var trimedQuery = q.trim();
            if (trimedQuery == ""){ return;}
            if (~al.detailText.indexOf(trimedQuery)){
              found = true;
            }
          });
          return found;
        });
      }

      res.send({
        latestCrawlDate: latestCrawlDate.format('YYYY/MM/DD HH:mm'),
        list: hitList
      });
    });
  });

  app.get('/reload', function (req, res){
    console.log(req.url);

    var addCount = 0;
    var alertList = null;

    Promise.resolve()
    .then(function(){
      return drop_db.get();
    })
    .then(function(result){
      alertList = result != null ? result.data : [];
      return Drop.getUpdatedList(alertList, app.get('reload'));
    })
    .then(function(result){
      var updatedList = result;
      latestCrawlDate = moment();

      addCount = updatedList.length;
      alertList = updatedList.concat(alertList);
      if (alertList.length > app.get('init')){
        alertList.splice(alertList.length - addCount, addCount);
      }

      return drop_db.save({data: alertList});
    })
    .then(function(){
      res.send({
        latestCrawlDate: latestCrawlDate.format('YYYY/MM/DD HH:mm'),
        updated: addCount 
      });
    });
  });

  app.listen(app.get('port'), function () {
    console.log('Drops listening on port ' + app.get('port'));
  });
}
