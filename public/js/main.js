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

    selectDetail: function(result){
      var self = this;
      var text = result.detailText;
      var html = text.replace(/\r\n/g, '</br>');
      self.detailText = html;
    },

    dispDetail: function(detailText){
      var self = this;
      var text = detailText;
      text = text.replace(/^(\r\n)+/, '')
                 .replace(/\r\n/g, '</br>');
      return text;
    },

    reload: function(){
      var self = this;
      axios.get('/reload')
      .then(function(response){
        console.log(response);
        var updatedCount = response.data.updated;
        if (updatedCount > 0){
          self.reloadMsg = response.data.updated + "件更新されました";
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
