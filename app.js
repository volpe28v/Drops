var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();
var path = require('path');
var program = require('commander');

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

var program = require('commander');
program
  .version('1.0.0')
  .option('-p, --port <n>', 'port no. default is 3000.')
  .parse(process.argv);

app.set('port', program.port || process.env.PORT || 3000);

app.get('/', function (req, res) {
  var options = { root: path.join(__dirname, '') };
  res.sendFile('index.html', options);
});

app.post('*', function (req, res){
  console.log(req.url);
  console.log(req.body);

  if (req.body.baseUrl == null || req.body.baseUrl == ''){ res.send("bad baseUrl"); return; }
  if (!isFinite(parseInt(req.body.projectID))) { res.send("bad projectID"); return; }
  if (!isFinite(parseInt(req.body.stationID))) { res.send("bad stationID"); return; }

  var baseUrl = req.body.baseUrl;
  if (baseUrl.slice(-1) != '/') { baseUrl = baseUrl + '/'; }
  baseUrl = baseUrl + "api/values/";

  var targetMethod = req.url.split("/").pop();
  var options = {
    uri: baseUrl + targetMethod,
    form: req.body,
    json: true
  };

  request.post(options, function(error, response, body){
    console.log(body);
    res.send(body);
  });
});


app.listen(app.get('port'), function () {
  console.log('PredictionViewr listening on port ' + app.get('port'));
});
