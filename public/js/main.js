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
      console.log(self.query);

      self.setQueryToLocalStorage(self.query);

      axios.post('/search', {
        query: self.query,
      })
      .then(function (response) {
        console.log(response);
        self.results = response.data;

        if (self.results.length > 0){
          self.selectDetail(self.results[0]);
        }
      })
      .catch(function (error) {
        console.log(error);
      });
    },

    dispDetail: function(detailText){
      var self = this;
      var text = detailText;
      text = text.replace(/^(\r\n)+/, '')
                 .replace(/\r\n/g, '</br>');

      if (self.query != ""){
        var queries = self.query.split(',');
        queries.forEach(function(q){
          var reg = new RegExp("(" + q + ")",'g');
          text = text.replace(reg, '<font color="red">$1</font>');
        });
      }

      return text;
    },

    reload: function(){
      var self = this;
      self.reloadMsg = "リロード中...";

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
