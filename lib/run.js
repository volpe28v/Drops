var Drop = require("./drop");

Drop.getList()
  .then(function(result){
    console.log(result.filter(function(r){ return r.detailText == "";}));
    //console.log(result);
    console.log(result.length);
  });
