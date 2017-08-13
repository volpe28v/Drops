// vue vm
var moment = require("moment");
moment.locale('ja');

var axios = require("axios");

new Vue({
  el: '#app',
  data: {
    query: "",
    results: [],
    detailText: "",
    reloadMsg: "",
    latestCrawlDate: "",
    latestDataDate: "",
  },

  computed: {
    dispCount: function(){
      return this.results.length + "件";
    }
  },

  mounted: function(){
    var self = this;
    self.query = self.getQueryLocalstorage();
    self.search();
  },

  methods: {
    search: function(){
      var self = this;

      self.setQueryToLocalStorage(self.query);

      axios.post('/search', {
        query: self.query,
      })
      .then(function (response) {
        console.log(response);
        self.results = response.data.list;
        self.latestCrawlDate = response.data.latestCrawlDate;
        self.latestDataDate = response.data.latestDataDate;
      })
      .catch(function (error) {
        console.log(error);
      });
    },

    dispDetail: function(detailText){
      var self = this;
      var text = detailText;
      text = text.replace(/^(\r\n)+/, '')
                 .replace('<img alt="Compiled by FRICS" src="/pcstatic/image/company_logo_ip.png">','');

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

    reload: function(){
      var self = this;
      self.reloadMsg = "クロール中...";

      axios.get('/reload')
      .then(function(response){
        console.log(response);
        var updatedCount = response.data.updated;
        if (updatedCount > 0){
          self.reloadMsg = response.data.updated + "件更新されました";
          self.search();
        }else{
          self.reloadMsg = "最新です";
        }

        self.latestCrawlDate = response.data.latestCrawlDate;
        self.latestDataDate = response.data.latestDataDate;
      });
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
  }
});
