// vue vm
var moment = require("moment");
moment.locale('ja');

var axios = require("axios");

new Vue({
  el: '#app',
  data: {
    query: "",
    webhookUrl: "",
    results: [],
    detailText: "",
    reloadMsg: "",
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
  },

  mounted: function(){
    var self = this;

    self.getWebhookData();
  },

  methods: {
    getWebhookData: function(){
      var self = this;

      return new Promise(function(resolve, reject){
        axios.get('/getWebhookData', {})
          .then(function (response) {
            console.log(response);
            self.query = response.data.query;
            self.webhookUrl = response.data.url;

            resolve();
          })
          .catch(function (error) {
            reject();
          });
      });
    },

    save: function(){
      var self = this;

      return new Promise(function(resolve, reject){
        axios.post('/setWebhookData', {
          query: self.query,
          url: self.webhookUrl
        })
          .then(function (response) {
            console.log(response);
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
        axios.post('/testWebhook', {
          query: self.query,
          url: self.webhookUrl
        })
          .then(function (response) {
            console.log(response);
            resolve();
          })
          .catch(function (error) {
            reject();
          });
      });
    },
  }
});
