// vue vm
var moment = require("moment");
moment.locale('ja');

var axios = require("axios");

var router = new VueRouter({
  mode: 'history',
  routes: []
});

new Vue({
  router: router,
  el: '#app',
  data: {
    query: "",
    results: [],
    detailText: "",
    message: "",
    latestCrawlDate: "",
    latestDataDate: "",
    enabledNotify: true,
  },

  computed: {
    dispCount: function(){
      return this.results.length + "件";
    }
  },

  watch: {
    enabledNotify: function(val){
      this.requestNotification();
    }
  },

  mounted: function(){
    var self = this;
    self.requestNotification();

    var url_query = this.$route.query.key;
    if (url_query != null){
      self.query = url_query;
    }else{
      self.query = self.getQueryLocalstorage();
    }
    self.search();

    setInterval(function(){
      var latestSearchedDate = self.results.length > 0 ? self.results[0].date : null;
      self.search()
      .then(function(){
        var newestSearchedDate = self.results.length > 0 ? self.results[0].date : null;

        if (latestSearchedDate != newestSearchedDate){
          // 検索結果に最新あり。通知する
          self.doNotification();
        }
      });

    }, 30 * 60 * 1000);
  },

  methods: {
    clearMessage: function(message){
      var self = this;
      self.message = message;
      setTimeout(function(){
        self.message = "";
      }, 3000);
    },

    search: function(){
      var self = this;

      return new Promise(function(resolve, reject){
        self.message = "検索中...";
        self.setQueryToLocalStorage(self.query);

        axios.post('/search', { query: self.query })
          .then(function (response) {
            console.log(response);
            self.results = response.data.list;
            self.latestCrawlDate = response.data.latestCrawlDate;
            self.latestDataDate = response.data.latestDataDate;
            self.clearMessage("検索しました");
            resolve();
          })
          .catch(function (error) {
            reject();
          });
      });
    },

    dispDetail: function(detailText){
      var self = this;
      var text = detailText;
      text = text.replace(/^(\r\n)+/, '')
                 .replace('<img alt="Compiled by FRICS" src="/pcstatic/image/company_logo_ip.png">','')
                 .replace(/style="width:987px;"/g,'')
                 .replace(/nowrap/g,'');

      if (self.query != ""){
        var queries = self.query.split(',');
        queries.forEach(function(q){
          var trimedQuery = q.trim();
          if (trimedQuery == ""){ return; }
          var reg = new RegExp("(" + trimedQuery + ")",'g');
          text = text.replace(reg, '<font color="lime">$1</font>');
        });
      }

      return text;
    },

    getQueryLocalstorage: function(){
      try{
        if (localStorage && localStorage.query){
          return localStorage.query;
        }
        return "";
      }catch (err){
        return "";
      }
    },

    setQueryToLocalStorage: function(query){
      try{
        if (localStorage){
          localStorage.query = query;
        }
      }catch (err){
      }
    },

    requestNotification: function(){
      var self = this;
      if (!self.enabledNotify){ return; }

      if(Notification){
        Notification.requestPermission();
      }
    },

    doNotification: function(){
      if (!self.enabledNotify){ return; }

      var notif_title = "Drops";
      var notif_msg = "川の防災情報に検索対象の警報が追加されました!";

      var notification = new Notification(notif_title, {
        body: notif_msg
      });
      setTimeout(function(){
        notification.close();
      }, 10 * 1000);
    }
  }
});
