
// Submit a tag or tags to allTags collection, which is a general collection for all
// built in tags
/*
function submitCommonTag(){
  var tags = document.getElementById("commonTags").value;
  alert(tags);
}
*/
$(document).ready(function(){
  
  $("#submitTags").click(function(){
    $('#returnTags').text("");
    alert("value is: " + $("#commonTags").val());
    $.post("/submitcommontag", {
        tags: $("#commonTags").val(),
        category: $("#category").val()
    },
    function(data, status){
      console.log("data: " + data.msg);
      if(data.flag == "fail"){ 
        console.log("bad array: " + data.bad_array);
        $('#returnTags').text(data.msg + " : " + (data.bad_array ? data.bad_array.join() : data.exist_entry)); 
        $("#commonTags").val("");
      }
      else { $('#returnTags').text(data.msg); $("#commonTags").val(""); }
    });
  });
  
  $("#submitText").click(function(){
    var newArr = [];
    var oldArr = [];
    var replaced = $("#convertToComma").val().replace(/[\s]|(and )|[()]|[-]|[&]/gi, ",");
    oldArr = replaced.split(",");
    oldArr.forEach(function(value, index){
      if(value) { 
        value = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
        newArr.push(value); 
      }
    });
    $("#convertResult").val(newArr);
    console.log(replaced);

  });
  

});