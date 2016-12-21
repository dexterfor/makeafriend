function addTag(tagId){
  
  var liSpan_1, liSpan_2, tagExists = true;
  
  var ul_li_object = document.getElementById("enterTags").getElementsByTagName("LI");
  var liElemArr = [];
  
  for( var i in ul_li_object ) {
    if (ul_li_object.hasOwnProperty(i)){
       liElemArr.push(ul_li_object[i].firstChild.innerHTML);
    }
  }
  
  liElemArr.forEach(function(value, index){
    console.log("inside addTag() forEach, index is: " + index + " and value is: " + value);
    if (value == tagId) {
      tagExists = false;
      document.getElementById("generalTagsAlerts").classList.add("alert-danger");
      document.getElementById("generalTagsAlerts").innerHTML = "Tag already exists!" 
    } 
  });
  
  if(tagExists){
    
    document.getElementById("generalTagsAlerts").innerHTML = "" 
   
    document.getElementById(tagId).classList.add("generalTagClicked");
  
    liSpan_1 = "<li class='tagit-choice ui-widget-content ui-state-default " +
                 "ui-corner-all tagit-choice-editable'  " +
                 "onclick='this.remove(); removeStyle(\"" + 
                 tagId + "\");'><span class='tagit-label'>"; 
  
    liSpan_2 = "</span><a class='tagit-close'><span class='text-icon'>\xd7" +
                 "</span><span class='ui-icon ui-icon-close'></span></a></li>";
  
    document.getElementById("enterTags").insertAdjacentHTML('afterbegin', 
                                           liSpan_1 + tagId + liSpan_2);
  }
  
}

function removeStyle(tagId){
  
  console.log("passed param tagId in removeStyle: " + tagId);
  document.getElementById(tagId).classList.remove("generalTagClicked");
  document.getElementById(tagId).classList.add("generalTag");

}

$(document).ready(function(){

  getUserInitialTags();
  
  function getUserInitialTags(){
  
    var initialTags;
   
    $('#enterTags .tagit-choice').each(function(i, items_list){
          
      $(items_list).find('.tagit-label').each(function(j, li){
        console.log("i is: " + i + " and value is: " + $(this).text())
        document.getElementById($(this).text()).classList.remove("generalTag");
        document.getElementById($(this).text()).classList.add("generalTagClicked");
        if(i == 0) initialTags = $(this).text();
        else { initialTags += "," + $(this).text(); }
      });
        
    });
        
    return initialTags;
    
  }
  
  $('#saveTags').on('click', function(){

    var generalTags = getUserInitialTags();
    console.log("commonTags string: " + generalTags);
    console.log("\nsame arrray after stringify" + JSON.stringify(generalTags));
      
    $.post("/user/savegeneraltags", { tagsAsString: generalTags}, 
             function(data, status){
             console.log("data: " + data.msg);
             if(data.flag == "fail"){ $('#confirmSaveTags').html(data.msg);} 
             else { 
                 $('#confirmSaveTags').html(data.msg); 
                 console.log("returned previous array" + data.savedCommonTags); 
             }
    });
  });
  
  // Disable Save Tags button to prevent accidental
  // run and connection to db
  
  $('#saveTags').prop('disabled', true);
  $('ol li input').prop('disabled', true);
  
  $('#editTags').on('click', function(){
    $('#saveTags').prop('disabled', false);
    $('ol li input').prop('disabled', false);    
  });
  
});