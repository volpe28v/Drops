var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();
var path = require('path');
var program = require('commander');
var moment = require('moment');
var CronJob = require('cron').CronJob;

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

var program = require('commander');
program
  .version('1.0.0')
  .option('-i, --init <n>', 'initial count. default is 300.')
  .option('-r, --reload <n>', 'reload count. default is 100.')
  .option('-d, --db_name [name]', 'db name. default is "drops_db".')
  .option('-h, --host [name]', 'host name. default is "http://localhost".')
  .option('-p, --port <n>', 'port no. default is 3000.')
  .parse(process.argv);

app.set('port', program.port || process.env.PORT || 3000);
app.set('init', program.init || process.env.INIT || 300);
app.set('reload', program.reload || process.env.RELOAD || 100);
app.set('db_name', program.db_name || 'drops_db');
app.set('host', program.host || 'http://localhost');

var Drop = require("./lib/drop");
var mongo_builder = require('./lib/mongo_builder');
var drop_db = require("./lib/drops_db");
var webhook_data = require("./lib/webhook_data");

Promise.all([
  mongo_builder.ready(app.get('db_name'))
])
.then(function(results){
  drop_db.set_db(results[0]);
  webhook_data.set_db(results[0]);
  startServer();

  startCron();
});

function startServer(){
  app.get('/', function (req, res) {
    var options = { root: path.join(__dirname, 'public') };
    res.sendFile('index.html', options);
  });

  app.get('/init', function (req, res){
    console.log(req.url);

    var addCount = 0;
    var latestCrawlDate = moment();
    var latestDataDate = "";
    Promise.resolve()
      .then(function(result){
        return Drop.getUpdatedList([], app.get('init'));
      })
      .then(function(result){
        var updatedList = result;

        addCount = updatedList.length;
        if (addCount > 0){
          latestDataDate = updatedList[0].date;
        }
        return drop_db.save({
          data: updatedList,
          latestDate: latestCrawlDate.toDate()
        });
      })
      .then(function(){
        res.send({
          latestCrawlDate: latestCrawlDate.format('YYYY/MM/DD HH:mm'),
          latestDataDate: latestDataDate,
          updated: addCount 
        });
      });
  });

  app.post('/search', function (req, res){
    console.log(req.url);
    console.log(req.body);
    var query = req.body.query;

    searchByQuery(query)
      .then(function(result){
        res.send(result);
      });
  });

  app.get('/reload', function (req, res){
    console.log(req.url);

    Promise.resolve()
      .then(function(){
        return reloadInfo();
      })
      .then(function(result){
        res.send({
          latestCrawlDate: result.latestCrawlDate,
          latestDataDate: result.latestDataDate,
          updated: result.addCount 
        });
      });
  });

  app.get('/silent_reload', function (req, res){
    console.log(req.url);

    res.send("reload started");
    reloadInfo();
  });

  app.get('/webhook', function (req, res) {
    var options = { root: path.join(__dirname, 'public') };
    res.sendFile('webhook.html', options);
  });

  app.get('/getWebhookData', function(req, res){
    webhook_data.get()
      .then(function(result){
        if (result != null){
          res.send({
            query: result.query,
            url: result.url
          });
        }else{
          res.send({
            query: "",
            url: "" 
          });
        }
      });
  }),

  app.post('/setWebhookData', function(req, res){
    console.log(req.body);
    webhook_data.save(req.body)
    .then(function(){
      res.send({ result: "save ok"});
    });
  }),

  app.post('/testWebhook', function(req, res){
    console.log(req.body);
    
    var url = req.body.url;
    var query = req.body.query;
    var options = {
      uri: url,
      form: {
        host: app.get('host') + ":" + app.get('port'),
        query: "ThisIsTest," + query
      },
      json: true
    };

    request.post(options, function(error, response, body){
      if (!error && response.statusCode == 200) {
        console.log("post webhook ok");
        res.send({ result: "ok"});
      } else {
        console.log('post webhook error');
        res.send({ result: "error"});
      }
    });
  }),


  app.listen(app.get('port'), function () {
    console.log('Drops listening on port ' + app.get('port'));
  });
}

function searchByQuery(query){
  return new Promise(function(resolve, reject){
    var queries = query.split(',');

    Promise.resolve()
      .then(function(){
        return drop_db.get();
      })
      .then(function(result){
        var alertList = result != null ? result.data : [];
        var latestCrawlDate = result != null ? moment(result.latestDate): moment();
        var latestDataDate = result != null ? (result.data.length > 0 ? result.data[0].date : "") : "";
        console.log(result.latestDate);

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

        resolve({
          latestCrawlDate: latestCrawlDate.format('YYYY/MM/DD HH:mm'),
          latestDataDate: latestDataDate,
          list: hitList
        });
      });
  });
}

function startCron(){
  var cronTime = '0 */30 * * * *';

  new CronJob({
    cronTime: cronTime,
    onTick: function () {
      console.log("cron job");

      var url = null;
      var query = "";

      var beforeSearchResult = null;
      Promise.resolve()
        .then(function(){
          return webhook_data.get();
        })
        .then(function(result){
          if (result != null && result.url != ""){
            url = result.url;
            query = result.query;
          }
          // 更新前の検索結果最新時刻を取得
          return searchByQuery(query);
        })
        .then(function(result){
          beforeSearchResult = result;

          // クロール開始
          return reloadInfo();
        })
        .then(function(result){
          console.log(result);
          // 更新後の検索結果最新時刻を取得
          return searchByQuery(query);
        })
        .then(function(result){
          // 変更があれば通知
          var afterSearchResult = result;

          var beforeLatestDate = beforeSearchResult.list.length > 0 ? beforeSearchResult.list[0].date : null;
          var afterLatestDate = afterSearchResult.list.length > 0 ? afterSearchResult.list[0].date : null;
          console.log(beforeLatestDate);
          console.log(afterLatestDate);

          if (url != null && beforeLatestDate != afterLatestDate){

            var options = {
              uri: url,
              form: {
                host: app.get('host') + ":" + app.get('port'),
                query: query
              },
              json: true
            };

            request.post(options, function(error, response, body){
              if (!error && response.statusCode == 200) {
                console.log("post webhook ok");
              } else {
                console.log('post webhook error');
              }
            });
          }
        });
    },
    start: true
  });
}

function reloadInfo(){
  var addCount = 0;
  var alertList = null;
  var latestCrawlDate = moment();
  var latestDataDate = "";

  return new Promise(function(resolve,reject){
    Promise.resolve()
      .then(function(){
        return drop_db.get();
      })
      .then(function(result){
        alertList = result != null ? result.data : [];
        if (alertList.length> 0){
          latestDataDate = alertList[0].date;
        }

        return Drop.getUpdatedList(alertList, app.get('reload'));
      })
      .then(function(result){
        var updatedList = result;
        latestCrawlDate = moment();

        addCount = updatedList.length;
        if (addCount > 0){
          latestDataDate = updatedList[0].date;
        }

        alertList = updatedList.concat(alertList);
        if (alertList.length > app.get('init')){
          alertList.splice(alertList.length - addCount, addCount);
        }

        return drop_db.save({
          data: alertList,
          latestDate: latestCrawlDate.toDate(),
          latestDataDate: latestDataDate,
        });
      })
      .then(function(){
        resolve({
          latestCrawlDate: latestCrawlDate.format('YYYY/MM/DD HH:mm'),
          latestDataDate: latestDataDate,
          updated: addCount 
        });
      });
  });
}


