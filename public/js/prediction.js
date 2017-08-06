var axios = require("axios");
var moment = require("moment");
moment.locale('ja');

var predictionComponent = Vue.component('prediction',{
  template: '<div>\
    <div class="svg-header">\
      <div class="title-area"><span v-bind:class="{ success: !isError, error: isError }">{{waterLevelResultLatestDispDate}}</span> - {{prediction.baseUrl}} P:{{prediction.projectID}} S:{{prediction.stationID}} D:{{prediction.delay}} Now: {{nowWaterLevel}} Max: {{maxWatarLevel}}</div>\
      <div class="delete-button" v-on:click="deletePrediction">x</div>\
    </div>\
    <div class="svg-area">\
      <svg class="prediction-svg"></svg>\
    </div>\
  </div>',

  props: ['index', 'prediction', 'base_url', 'project_id','station_id','delay', 'target_date'],

  data: function(){
    return {
      waterLevelResult: null,
      waterLevelPlan: null,
      chartSetting: null,
      svgWidth: 0,
      svgHeight: 0,
      localDate: moment() ,
      waterLevelResultLatestDate: moment(),
      isError: false,
      id: new Date().getTime().toString(16)  + Math.floor(Math.random()).toString(16),
    }
  },

  computed: {
    graphID: function(){
      return "graph_" + this.id;
    },
    waterLevelResultLatestDispDate: function(){
      return this.waterLevelResultLatestDate.format('YYYY:MM:DD HH:mm');
    },
    nowWaterLevel: function(){
      if (this.waterLevelResult != null){
        var nowValue = this.waterLevelResult[this.waterLevelResult.length-1].value;
        return Math.floor(nowValue * 100) / 100; 
      }else{
        return '';
      }
    },
    maxWatarLevel: function(){
      if (this.waterLevelPlan != null){
        var maxValue = Math.max.apply(null,this.waterLevelPlan.map(function(p){ return p.value;}));
        return Math.floor(maxValue * 100) / 100; 
      }else{
        return '';
      }
    }
  },

  watch: {
    target_date: function(){
      this.update();
    }
  },

  mounted: function(){
    this.update();
  },

  updated: function(){
    if (this.prediction.projectID != this.chartSetting.ProjectID){
      // 削除後にProjectID がずれたら読み直す
      this.localDate = moment();
      this.update();
    }
  },

  methods: {
    update: function(){
      var self = this;

      this.updateData()
        .then(
          function(success){
            if (success){
              var forceUpdate = true;
              self.updateGraph(forceUpdate);
            }
            self.isError = !success;
          },
          function(){
            var forceUpdate = false;
            self.updateGraph(forceUpdate);
          }
        );
    },

    updateData: function(){
      var self = this;

      return new Promise(function(resolve, reject){
        // 遅延を反映し10分単位に変換
        var adjustedDate = moment(self.target_date)
          .add(self.delay * -1, 'minute')
          .add((self.target_date.minute() % 10) * -1, 'minute')
          .millisecond(0)
          .second(0);

        if (adjustedDate.isSame(self.localDate)){
          // 更新済みの場合はデータを取得しない
          reject(); return;
        }

        self.localDate = adjustedDate;
        console.log(adjustedDate.format('YYYY:MM:DD HH:mm:ss'));

        var param = {
          baseUrl: self.prediction.baseUrl,
          projectID: self.prediction.projectID,
          stationID: self.prediction.stationID,
          year: adjustedDate.year(),
          month: adjustedDate.month() + 1,
          day: adjustedDate.date(),
          hour: adjustedDate.hour(),
          minute: parseInt(adjustedDate.minute() / 10) * 10
        };

        function getWaterLevelResult(){
          var url = "PostWaterLevelResultChartDataSelectDateForDateNum";
          return axios.post(url, param);
        }

        function getWaterLevelPlan(){
          var url = "PostWaterLevelPlanChartDataSelectDateForDateNum";
          return axios.post(url, param);
        }

        function getChartSetting(){
          var url = "postChartSetting";
          return axios.post(url, param);
        }

        axios.all([getWaterLevelResult(), getWaterLevelPlan(), getChartSetting()])
          .then(axios.spread(function (wlr, wlp, chs) {
            console.log(wlr);
            console.log(wlp);
            console.log(chs);

            if (wlr.data.ChartDates.length == 0 || wlp.data.ChartDates.length == 0 || chs.data.length == 0){
              // データが不完全
              resolve(false); return;
            }

            self.waterLevelResultLatestDate = moment(wlr.data.ChartDates[wlr.data.ChartDates.length-1]);

            self.waterLevelResult = wlr.data.ChartDates.map(function(d,i){
              return {
                moment: moment(d),
                date: d3.timeParse("%Y/%m/%d %H:%M")(moment(d).format('YYYY/MM/DD HH:mm')),
                value: wlr.data.WaterLevels[i]
              };
            });
            self.waterLevelPlan = wlp.data.ChartDates.map(function(d,i){
              return {
                moment: moment(d),
                date: d3.timeParse("%Y/%m/%d %H:%M")(moment(d).format('YYYY/MM/DD HH:mm')),
                value: wlp.data.WaterLevels[i]
              };
            });

            if (chs.data.length > 0){
              self.chartSetting = chs.data[0];
            }

            resolve(true);
          }));
      });
    },

    updateGraph: function(forceUpdate){
      var self = this;

      if (self.waterLevelResult == null){ return; }

      // サイズが変わっていたら再描画
      var svg = d3.select(self.$el).select("svg");
      var svg_width = parseInt(svg.style("width"));
      var svg_height = parseInt(svg.style("height"));

      if (!forceUpdate && 
          (self.svgWidth == svg_width && self.svgHeight == svg_height)){
        return;
      }else{
        self.svgWidth = svg_width;
        self.svgHeight = svg_height;
      }

      var margin = {top: 20, right: 40, bottom: 30, left: 50};
      var width = svg_width - margin.left - margin.right;
      var height = svg_height - margin.top - margin.bottom;

      var data = self.waterLevelResult.concat(self.waterLevelPlan);
      var adjustedPlan = [self.waterLevelResult[self.waterLevelResult.length-1]].concat(self.waterLevelPlan);

      var water_lines = [
        { id: "water-result", color: "deepskyblue", values: self.waterLevelResult },
        { id: "water-plan"  , color: "lime" , values: adjustedPlan }
      ];

      svg.selectAll('g').remove();
      var g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      var parseTime = d3.timeParse("%Y/%m/%d %H:%M");

      var x = d3.scaleTime()
        .rangeRound([0, width]);
      var y = d3.scaleLinear()
        .rangeRound([height, 0]);

      var xAxis = d3.axisBottom(x)
        .tickFormat(function(date){
          var m = moment(date);
          return m.format('DD日 HH:mm');
        });

      var line = d3.line()
        .x(function(d) { return x(d.date); })
        .y(function(d) { return y(d.value); });

      x.domain(d3.extent(data, function(d) { return d.date}));
      y.domain([self.chartSetting.YMinValue, self.chartSetting.YMaxValue]);

      g.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

      g.append("g")
        .call(d3.axisLeft(y))
        .append("text")
        .attr("fill", "#000")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", "0.71em")
        .attr("text-anchor", "end");

      var water_line = g.selectAll(".water-line")
        .data(water_lines)
        .enter().append("g")
          .attr("class", "water-line");

      water_line.append("path")
        .attr("fill", "none")
        .attr("stroke", function(d){ return d.color;})
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", 2.5)
        .attr("d", function(d){ return line(d.values);});
    },

    deletePrediction: function(){
      this.$emit('delete-prediction', this.prediction);
    }

  }
});

module.exports = predictionComponent;
