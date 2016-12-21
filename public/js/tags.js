$(document).ready(function(){
  // Collect input elements values, sanitize and 
  // make an AJAX request
  $('#save_tags').on('click', function(){
    var userTags = [];
    var illegalChar = false;
    var regex = new RegExp("^[a-zA-Z0-9 ]+$");
    
    // Check if a DOM array element is not empty, sanitize
    // and push it into userTags array
    $('#user_tags li input.user_tag').each(function(index){
      var tag = $.trim($(this).val());
      if(tag) {
        if(regex.test(tag)) {
          userTags.push(tag);
        } else { illegalChar = true; } // if illegal chars are found
      }
    });
    
    // if illegal chars are found issue a warning msg
    if(illegalChar){
      $('#tags_alerts').removeClass();
      $('#tags_alerts').addClass('alert alert-danger').
              html("Only alphanumeric characters and spaces allowed");
    // if no illegal chars are found then make an ajax req and send array
    } else {
      
      console.log('typeof userTags');
      console.log(typeof userTags);
      
        $.ajax({
        url: '/user/save_tags',
        type: 'POST',
        data: { 'tags[]': userTags },

        beforeSend: function () {
          $('#tags_alerts').removeClass();
          $('#tags_alerts').addClass('alert alert-info');
          $('#tags_alerts').html("Saving, please wait....");
        },
        success: function (response) {
          $('#tags_alerts').removeClass();
          $('#tags_alerts').addClass('alert alert-success');
          $('#tags_alerts').html(response.msg);
        },
        complete: function (response) {
          if(response.responseJSON.success){
            console.log(response.responseJSON.msg);
            $('#tags_alerts').removeClass();
            $('#tags_alerts').addClass('alert alert-info');
            $('#tags_alerts').html(response.responseJSON.msg);
          } else {
            console.log(response.responseJSON.msg);
            $('#tags_alerts').removeClass();
            $('#tags_alerts').addClass('alert alert-danger');
            $('#tags_alerts').html(response.responseJSON.msg);
          }
        },
        error: function (response) {
          $('#tags_alerts').removeClass();
          $('#tags_alerts').addClass('alert alert-danger');
          $('#tags_alerts').html(response.msg);            
        }
        });
    }
  }); // end of Save Tags button click
  
}); // end of document ready
