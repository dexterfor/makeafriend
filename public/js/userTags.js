$(document).ready(function(){
  // Disable some DOM elements to prevent from accidental
  // AJAX request and consequent connection to DB
  
  // disable save button
  $('#saveTags').prop('disabled', true);
  
  // disable text inputs
  $('ol li input').prop('disabled', true);

  // On click editTags the form and save button are enabled
  $('#editTags').on('click', function(){
    $('#saveTags').prop('disabled', false);
    $('ol li input').prop('disabled', false);    
  });
  
  // Collect input elements values, sanitize and 
  // make an AJAX request
  $('#saveTags').on('click', function(){
    var userTags = [];
    var illegalChar = false;
    var regex = new RegExp("^[a-zA-Z0-9]+$");
    
    // Check if a DOM array element is not empty, sanitize
    // and push it into userTags array
    $('#userTags li input.userTag').each(function(index){
      var tag = $.trim($(this).val());
      if(tag) {
        if(regex.test(tag)) {
          userTags.push(tag);
        } else { illegalChar = true; } // if illegal chars are found
      }
    });
    
    // if illegal chars are found issue a warning msg
    if(illegalChar){
      $('#generalTagsAlerts').removeClass();
      $('#generalTagsAlerts').addClass('alert alert-danger').
              html("Only alphanumeric characters allowed");
    // if no illegal chars are found then make an ajax req and send array
    } else {
        $.post( 
          "/user/savegeneraltags", 
          { 'tags[]': userTags }
        ).done(function(response){
             if(response.success){ 
              $('#generalTagsAlerts').removeClass();
              $('#generalTagsAlerts').addClass('alert alert-success').
                html(response.msg);
             } else { 
                 $('#generalTagsAlerts').removeClass();
                 $('#generalTagsAlerts').addClass('alert alert-danger').
                  html(response.msg); 
             }
          });
    }
  }); // end of Save Tags button click
  
}); // end of document ready
