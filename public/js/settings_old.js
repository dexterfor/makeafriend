$(document).ready(function(){
  
  $('#saveLoc').addClass('displayNone');
  $('#editLoc').addClass('displayNone');
  $('#autocomplete').addClass('displayNone');
  
  $('#saveImg').on('click', function(){
    var fd = new FormData();
    fd.append( "file", $("#pic")[0].files[0]);
    $.ajax({
    url: '/upload_img',
    type: 'POST',
    cache: false,
    data: fd,
    processData: false,
    enctype: 'multipart/form-data',
    contentType: false,
    beforeSend: function () {
        $("#settingsAlerts").html("Uploading, please wait....");
    },
    success: function (data) { 
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
        $("#settingsAlerts").html("Error. File is too large! The image may not be displayed properly"); 
      } else if(data.status == 453){
        $("#settingsAlerts").html(data.responseText);
      } else {
        $("#settingsAlerts").html(data.statusText);
        console.log('error. data is: \n');
        console.log(data);
      }  
    }
    });
    
  }); // end of saveImg click

// Start Remove Image  
  $('#removeImg').on('click', function(){
    
    $.ajax({
    url: '/removeimg',
    type: 'POST',
    
    beforeSend: function () {
        $("#settingsAlerts").html("Removing, please wait....");
    },
    success: function (data) { 
        $("#settingsAlerts").html("Success: " + data.responseText);
        console.log('success. data is: \n');
        console.log(data);
        location.reload();
    },
    complete: function (data) {
        $("#settingsAlerts").html("Complete: " + data.responseText);
        console.log('complete. data is: \n');
        console.log(data);
    },
    error: function (data) {
        $("#settingsAlerts").html(data.responseText); 
        console.log('error. data is: \n');
        console.log(data);
    }
    });
    
  }); // end of RemoveImg click
  
}); // end of document ready


// Using window load since getting Google Places JS file takes time
// the file needs to be fully loaded for autocomplete to work
$(window).load(function(){

  $('#autocomplete').removeClass('displayNone').addClass('displayInitial');
  $('#saveLoc').removeClass('displayNone').addClass('displayInitial');
  $('#editLoc').removeClass('displayNone').addClass('displayInitial');
  var alertsElement = document.getElementById('settingsAlerts');    
  
  // Start :: Autocomplete
  var input = document.getElementById('autocomplete');
  
  // User location object
  var locObj = { 
    locality: false,
    administrative_area_level_1: false,
    country: false
  };
  
  
  // Create an autocomplete object
  var autocomplete = new google.maps.places.Autocomplete(input);
  
  autocomplete.addListener('place_changed', function(){
    
    // Clear alerts div of any class names or text
    alertsElement.className = ""; 
    alertsElement.innerHTML = "";    
    
    // Get place details from the autocomplete object
    var place = autocomplete.getPlace();

    console.log("place obj below\n");
    console.log(place);
    //console.log('address types 0 locality:');
    //console.log(place.address_components[0].long_name);
    
    var componentForm = {
      locality: 'long_name',
      administrative_area_level_1: 'short_name',
      country: 'long_name'
    };
    
    for (var i = 0; i < place.address_components.length; i++) {
      var addressType = place.address_components[i].types[0];
      if (componentForm[addressType]) {
        locObj[addressType] = place.address_components[i][componentForm[addressType]];
      }
    }
   
/*TEST REMOVE BEFORE PRODUCTION
    locObj.locality = "svarsfdasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfsadfasdfasdfasdfasdfasdfasdfsfaqwerwqerwqerqwerqwerd";
    locObj.administrative_area_level_1 = 'svenska';
    locObj.country = "sweden";
*/
    console.log('userlocation obj below');
    console.log(locObj);
    
    //input.value = place.formatted_address;
  });
// End :: Autocomplete  

  $('#editLoc').on('click', function(){
    document.getElementById('saveLoc').removeAttribute('disabled');
    document.getElementById('autocomplete').removeAttribute('disabled');
  });


// Save location button
  $('#saveLoc').on('click', function(){
    // Clear alerts div of any class names or text
    alertsElement.className = ""; 
    alertsElement.innerHTML = "";   
    
    var rgx = new RegExp(/[$<>(){}]+/);
    var illegalChars = true;
    
    var rgxLty = rgx.test(locObj.locality);
    var rgxState = rgx.test(locObj.administrative_area_level_1);
    var rgxCtry = rgx.test(locObj.country);
    
    if (rgxLty || rgxState || rgxCtry) { illegalChars = false; }
    
    // Saving location object made of city (locality),
    // state/prov (administrative_area_level_1) and country
    if(locObj.locality && locObj.country && illegalChars){
      $.ajax({
        url: '/saveloc',
        type: 'POST',
        data: { userLocation: locObj},

        beforeSend: function () {
          alertsElement.innerHTML = "Saving, please wait....";
        },
        success: function (data) {
          alertsElement.className = "alert alert-success";
          alertsElement.innerHTML = data;
            //console.log('success. data is: \n');
            //console.log(data);
        },
        complete: function (data) {
          //alertsElement.className = "alert alert-success";
          //alertsElement.innerHTML = data.responseText;
            //console.log('complete. data is: \n');
            //console.log(data);
        },
        error: function (data) {
          alertsElement.className = "alert alert-danger";
          alertsElement.innerHTML = "Error occurred. " + data.responseText; 
            //console.log('error. data is: \n');
            //console.log(data);
        }
        });    

    } else { 
        alertsElement.className = "alert alert-danger";
        alertsElement.innerHTML = "Location is empty or autocomplete is inactive! Start typing city, wait for autocomplete";
    }
    
  }); // end of saveLoc click
      
}); // end of window load