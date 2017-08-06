var client = require('cheerio-httpcli');

var baseUrl = 'http://www.river.go.jp';
var topUrl = '/kawabou/ipInfoList.do?gamenId=01-1301&fvrt=yes';

function parseLink($dom){
  var area = $dom.find('.tb1td1').text();
  var date = $dom.find('.tb1td2').text();

  var href = $dom.find('a').attr('href');
  var title = $dom.find('a').text().replace(/[\t\r\n]/g,'');
  var goIpInfo_str = String(href)
                       .replace(/[\t\r\n]/g,'')
                       .replace('javascript:','');

  var detailUrl = eval(goIpInfo_str);
  return {
    area: area,
    date: date,
    detailUrl: baseUrl + detailUrl,
    title: title,
  };
}

function goIpInfo(initUrl, infoManageCode, gamenId){
  var url = initUrl;
  url = url + "?init=init";
  url = url + "&infoManageCode=" + infoManageCode;
  url = url + "&gamenId=" + gamenId;

  return url;
}

function parseDetailText($){
  try {
  var detail = $('body').children('div')[1];
  var detailText = $(detail).text()
                            .replace(/[\t\r\n]/g,'')

  }catch(e){
    return "";
  }
  return detailText;
}

module.exports.getList = function(){
  return new Promise(function(resolve, reject){
    client.fetch(baseUrl + topUrl, {}, function (err, $, res) {
      var maxCount = 0;
      var list = [];
      $('.tb1').find('tr').each(function (idx) {
        if (maxCount > 500) return;
        maxCount++;

        if ($(this).hasClass('hyoHead')){
          return;
        }

        var link = parseLink($(this));
        list.push(link);
      });


      function getDetailText(l){
        return new Promise(function(resolve, reject){
          client.fetch(l.detailUrl, {}, function (err, $, res) {
            l.detailText = parseDetailText($);
            resolve(l);
          });
        });
      };

      list.reduce(function (current, link) {
        return current.then(function () {
          return getDetailText(link).then(function(result){
            console.log(result);
          });
        });
      }, Promise.resolve())
      .then(function(){
        resolve(list);
      });
    });
  });


  client.fetch(baseUrl + topUrl, {}, function (err, $, res) {
    var maxCount = 0;
    $('.tb1').find('tr').each(function (idx) {
      if (maxCount > 5) return;
      maxCount++;

      if ($(this).hasClass('hyoHead')){
        return;
      }

      var link = parseLink($(this));

      console.log(baseUrl + link.detailUrl);
      client.fetch(baseUrl + link.detailUrl, {}, function (err, $, res) {
        var detail = $('body').children('div')[1];
        var detailText = $(detail).text();

        console.log($(detail).text());
      });
      list.push(link);
    });

    console.log(list);
  });

  return ["this is drop", "second"];
};
