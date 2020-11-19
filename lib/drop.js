var client = require('cheerio-httpcli');

var baseUrl = 'http://www.river.go.jp/kawabou/html/notice/';
var topUrl = 'ipInfoList_ifc2_ac0.html';

function parseLink($dom){
  var area = $dom.find('.tb1td1').text();
  var date = $dom.find('.tb1td2').text();

  var href = $dom.find('a').attr('href');
  var title = $dom.find('a').text().replace(/[\t\r\n]/g,'');
  var goIpInfo_str = String(href)

  var detailUrl = goIpInfo_str;
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
    var detail = $('body').children('div')[2];
    var detailText = $(detail).html()
      .replace('地方','')
      .replace('発表年月日','')
      .replace('メイン表示','')
      .replace(/[\t]/g,'')
      .replace(/(\r\n)+/g,'\r\n');

  }catch(e){
    return "";
  }
  return detailText;
}

function getDetailText(l){
  return new Promise(function(resolve,reject){
    Promise.resolve()
      .then(function(){
        return client.fetch(l.detailUrl, {});
      })
      .then(function(result){
        l.detailText = parseDetailText(result.$);
        resolve(l);
      });
  });
}

function getIndexList(max){
  // 一覧取得
  return new Promise(function(resolve,reject){
    Promise.resolve()
      .then(function(){
        return client.fetch(baseUrl + topUrl, {});
      })
      .then(function(result){
        var $ = result.$;
        var maxCount = 0;
        var list = [];
        $('.tb1').find('tr').each(function (idx) {
          if (maxCount > max) return;
          maxCount++;

          if ($(this).hasClass('hyoHead')){
            return;
          }

          var link = parseLink($(this));
          list.push(link);
        });

        resolve(list);
      });
  });
}

function getDetails(list){
  // 詳細取得
  return new Promise(function(resolve,reject){
    Promise.resolve()
      .then(function(){
        return list.reduce(function (current, link) {
          return current.then(function () {
            return getDetailText(link).then(function(result){
              console.log(result);
            });
          });
        }, Promise.resolve());
      })
      .then(function(){
        resolve(list);
      });
  });
}

function isLatestLink(target, orgList){
  return orgList.filter(function(l){
    return target.area == l.area &&
           target.date == l.date &&
           target.title == l.title;
  }).length == 0;
}

function getLatestDetails(list, orgList){
  // 詳細取得(1件ずつ同期で取得する)
  var latestList = [];
  var foundOldLink = false;

  return new Promise(function(resolve,reject){
    Promise.resolve()
      .then(function(){
        return list.reduce(function (current, link) {
          return current.then(function (result) {
            if (result != null){
                latestList.push(result);
            }

            if (!foundOldLink && isLatestLink(link, orgList)){
              return getDetailText(link);
            }else{
              foundOldLink = true;
              return Promise.resolve();
            }
          });
        }, Promise.resolve());
      })
      .then(function(result){
        if (result != null){
          latestList.push(result);
        }

        resolve(latestList);
      });
  });
}

module.exports.getList = function(max){
  return new Promise(function(resolve,reject){
    Promise.resolve()
      .then(function(){
        return getIndexList(max);
      })
      .then(function(list){
        return getDetails(list);
      })
      .then(function(list){
        resolve(list);
      });
  });
};

module.exports.getUpdatedList = function(orgList,max){
  return new Promise(function(resolve,reject){
    Promise.resolve()
      .then(function(){
        return getIndexList(max);
      })
      .then(function(list){
        return getLatestDetails(list, orgList);
      })
      .then(function(list){
        resolve(list);
      });
  });
};

