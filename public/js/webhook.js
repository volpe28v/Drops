// vue vm
var moment = require("moment");
moment.locale('ja');

var axios = require("axios");

new Vue({
  el: '#app',
  data: {
    query: "",
    webhookUrl: "",
    logs: [],
    message: "",
    latestCrawlDate: "",
    latestDataDate: "",
  },

  computed: {
    dispCount: function(){
      return this.results.length + "件";
    }
  },

  watch: {
  },

  mounted: function(){
    var self = this;

    self.getWebhookData();

    axios.get('/getCrawlLogs', {})
      .then(function (response) {
        console.log(response);
        self.logs = response.data.logs;
      });
  },

  methods: {
    clearMessage: function(message){
      var self = this;
      self.message = message;
      setTimeout(function(){
        self.message = "";
      }, 3000);
    },

    getWebhookData: function(){
      var self = this;

      return new Promise(function(resolve, reject){
        self.message = "情報取得中...";
        axios.get('/getWebhookData', {})
          .then(function (response) {
            console.log(response);
            self.query = response.data.query;
            self.webhookUrl = response.data.url;
            self.clearMessage("情報取得しました");

            resolve();
          })
          .catch(function (error) {
            self.message = "情報取得に失敗しました";
            reject();
          });
      });
    },

    getCrawlLogs: function(){
      var self = this;
      return new Promise(function(resolve, reject){
        self.message = "ログ更新中...";
        axios.get('/getCrawlLogs', {})
          .then(function (response) {
            console.log(response);
            self.logs = response.data.logs;
            self.clearMessage("ログ更新しました");
            resolve();
          });
      });
    },

    save: function(){
      var self = this;

      return new Promise(function(resolve, reject){
        self.message = "保存中...";
        axios.post('/setWebhookData', {
          query: self.query,
          url: self.webhookUrl
        })
          .then(function (response) {
            console.log(response);
            self.clearMessage("保存しました");
            resolve();
          })
          .catch(function (error) {
            reject();
          });
      });
    },
 
    test: function(){
      var self = this;

      return new Promise(function(resolve, reject){
        self.message = "テスト通知中...";
        axios.post('/testWebhook', {
          query: self.query,
          url: self.webhookUrl
        })
          .then(function (response) {
            console.log(response);
            self.clearMessage("テスト通知しました");
            resolve();
          })
          .catch(function (error) {
            reject();
          });
      });
    },
  }
});
