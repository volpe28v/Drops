// vue vm
var prediction = require("./prediction");
var moment = require("moment");
moment.locale('ja');

new Vue({
  el: '#app',
  data: {
    baseUrl: "http://winmuse.cloudapp.net/damapp/",
    projectID: 100,
    stationID: 94,
    delay: 20,
    predictions: [],
    predictionsHistory: [],
    offsetSeconds: 70,
    targetDate: moment(),
  },

  computed: {
    targetDispDate: function(){
      return this.targetDate.format('YYYY:MM:DD HH:mm:ss');
    },
    adjustedDate: function(){
      return this.targetDate.add(this.offsetSeconds * -1, 'second');
    }
  },

  mounted: function(){
    var self = this;

    this.predictionsHistory = this.getHistoryFromLocalstorage();
    setInterval(function(){
      self.targetDate = moment();
    }, 1000);
  },

  methods: {
    addPrediction: function(){
      var prediction = {
        baseUrl: this.baseUrl,
        projectID: this.projectID,
        stationID: this.stationID,
        delay: this.delay
      };

      this.addPredictionList(prediction);
      this.addHistory(prediction);
    },

    addPredictionList: function(prediction){
      if (!this.containsPrediction(this.predictions, prediction)){
        this.predictions.push(prediction);
      }
    },

    addHistory: function(history){
      if (!this.containsPrediction(this.predictionsHistory, history)){
        this.predictionsHistory.unshift(history);
      }

      this.setHistoryToLocalStorage(this.predictionsHistory);
    },

    containsPrediction: function(list, target){
      return list.filter(function(p){
        return p.baseUrl == target.baseUrl &&
               p.projectID == target.projectID &&
               p.stationID == target.stationID &&
               p.delay == target.delay;
      }).length != 0;
    },

    selectHistory: function(history){
      this.addPredictionList(history);
    },

    getHistoryFromLocalstorage: function(){
      try{
        if (localStorage && localStorage.history){
          return JSON.parse(localStorage.history);
        }
        return [];
      }catch (err){
        return [];
      }
    },
    setHistoryToLocalStorage: function(history){
      try{
        if (localStorage){
          localStorage.history = JSON.stringify(history);
        }
      }catch (err){
      }
    },

    deletePrediction: function(target){
      var index = this.predictions.indexOf(target);
      this.predictions.splice(index,1);
    },
  }
});
