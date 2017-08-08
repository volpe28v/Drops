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
  .option('-p, --port <n>', 'port no. default is 3000.')
  .parse(process.argv);

app.set('port', program.port || process.env.PORT || 3000);
app.set('init', program.init || process.env.INIT || 300);
app.set('reload', program.reload || process.env.RELOAD || 100);

var Drop = require("./lib/drop");
var alertList = [];
var latestCrawlDate = null;

Drop.getList(app.get('init'))
.then(function(result){
  alertList = result;
  latestCrawlDate = moment();

  startServer();
});

function startServer(){
  app.get('/', function (req, res) {
    var options = { root: path.join(__dirname, '') };
    res.sendFile('index.html', options);
  });

  app.post('/search', function (req, res){
    console.log(req.url);
    console.log(req.body);
    var query = req.body.query;
    var queries = query.split(',');

    var hitList = alertList.filter(function(al){
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
    res.send({
      latestCrawlDate: latestCrawlDate.format('YYYY/MM/DD HH:mm'),
      list: hitList
    });
  });

  app.get('/reload', function (req, res){
    console.log(req.url);
    Drop.getUpdatedList(alertList, app.get('reload'))
    .then(function(updatedList){
      latestCrawlDate = moment();

      var addCount = updatedList.length;
      alertList = updatedList.concat(alertList);
      alertList.splice(alertList.length - addCount, addCount);
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
