$(document).ready(function(){

  $('#saveImg').on('click', function(){
    var fd = new FormData();
    fd.append( "file", $("#pic")[0].files[0]);
    
    if($("#pic")[0].files[0]){
      if($("#pic")[0].files[0].size > 110000){
        $("#settingsAlerts").removeClass();
        $("#settingsAlerts").addClass('alert alert-danger');
        $("#settingsAlerts").html("Image is too large! Maximum size is 100KB"); 
      } else {
        $.ajax({
          url: '/upload_img',
          type: 'POST',
          cache: false,
          data: fd,
          processData: false,
          enctype: 'multipart/form-data',
          contentType: false,
          beforeSend: function () {
              $("#settingsAlerts").removeClass();
              $("#settingsAlerts").addClass('alert alert-info');
              $("#settingsAlerts").html("Uploading, please wait....");
          },
          success: function (data) { 
              $("#settingsAlerts").removeClass();
              $("#settingsAlerts").addClass('alert alert-success');      
              $("#settingsAlerts").html(data);
              console.log('success. data is: \n');
              console.log(data);
              // because of reload the success message will not be displayed.
              location.reload();
          },
          complete: function (data) {
              //$("#settingsAlerts").html(data.responseText);
              console.log('complete. data is: \n');
              console.log(data);
          },
          error: function (data) {
            if(data.status == 455){
              $("#settingsAlerts").removeClass();
              $("#settingsAlerts").addClass('alert alert-danger');
              $("#settingsAlerts").html(data.responseText); 
            } else if(data.status == 453){
              $("#settingsAlerts").removeClass();
              $("#settingsAlerts").addClass('alert alert-danger');
              $("#settingsAlerts").html(data.responseText);
            } else {
              $("#settingsAlerts").removeClass();
              $("#settingsAlerts").addClass('alert alert-danger');
              $("#settingsAlerts").html(data.statusText);
              console.log('error. data is: \n');
              console.log(data);
            }  
          }
        });
      }
    } else { 
      $("#settingsAlerts").removeClass();
      $("#settingsAlerts").addClass('alert alert-danger');
      $("#settingsAlerts").html("No file has been selected!"); 
    }
    
  }); // end of saveImg click

// Start Remove Image  
  $('#removeImg').on('click', function(){
    
    $.ajax({
    url: '/remove_img',
    type: 'POST',
    
    beforeSend: function () {
        $("#settingsAlerts").html("Removing, please wait....");
    },
    success: function (data) { 
        $("#settingsAlerts").removeClass();
        $("#settingsAlerts").addClass('alert alert-success');
        $("#settingsAlerts").html("Success: " + data.responseText);
        console.log('success. data is: \n');
        console.log(data);
        location.reload();
    },
    complete: function (data) {
        $("#settingsAlerts").removeClass();
        $("#settingsAlerts").addClass('alert alert-warning');      
        $("#settingsAlerts").html("Complete: " + data.responseText);
        console.log('complete. data is: \n');
        console.log(data);
    },
    error: function (data) {
        $("#settingsAlerts").removeClass();
        $("#settingsAlerts").addClass('alert alert-danger');
        $("#settingsAlerts").html(data.responseText); 
        console.log('error. data is: \n');
        console.log(data);
    }
    });
    
  }); // end of RemoveImg click
  
}); // end of document ready