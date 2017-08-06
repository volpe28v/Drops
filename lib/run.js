var Drop = require("./drop");

Drop.getList(5)
  .then(function(result){
    result.splice(0,2); // ダミーで最新を削る

    Drop.getUpdatedList(result, 3)
    .then(function(result){
      console.log(result);
      console.log(result.length);
    });
  });
