$(document).ready(function(){   

  var profileObj = { firstName: "",
                      lastName: "",
                      yearOfBirth: 0000,
                      gender: "",
                      attraction: "",
                      aboutMe: ""
                    };
  var profileItems = [ "firstName",
                       "lastName",
                       "yearOfBirth",
                       "gender",
                       "attraction"
                     ];
                     
  var regex = new RegExp("^[a-zA-Z0-9 ]+$");
  var regexAboutMe = new RegExp("^[a-zA-Z0-9 !.,?()':;-]+$");
  
  // On clicking Save Profile collect all data from
  // text inputs, checkboxes, textarea and make an AJAX req
  $('#save_profile').on('click', function(){
    var illegalChar = false;
    var yearRequired = false;
   // Check if profile items are not empty and dont contain
   // illegal chars. 
    profileItems.forEach(function(element, index){
      var temp = $("#" + element).val().trim();
      if(temp){
        if(regex.test(temp)) {
          profileObj[element] = temp;
        } else { 
          alert('illegal in: ' + element);
          illegalChar = true; 
        }
      }
    });

    if($("#yearOfBirth").val().trim() < 1921 || $("#yearOfBirth").val().trim() > 1998){
      yearRequired = true;
    }

    if (regexAboutMe.test(($("#aboutMe").val().trim()))){ 
       profileObj["aboutMe"] = $("#aboutMe").val();
    } else if($("#aboutMe").val() == ""){
       profileObj["aboutMe"] = undefined;
    } else {
        illegalChar = true; 
    }

    var profileAlerts = document.getElementById("profile_alerts");
    // if illegal chars are found issue a warning msg
    if(illegalChar){
      // There are reported issues with jQuery removeClass
      // so using native DOM methods
      profileAlerts.className = "";
      profileAlerts.className = 'alert alert-danger';
      profileAlerts.innerHTML = "Only alphanumeric and punctuation marks are allowed";
    // if no illegal chars are found then make an ajax req and send ProfileObj
    } else if(yearRequired){
      profileAlerts.className = "";
      profileAlerts.className = 'alert alert-danger';
      profileAlerts.innerHTML = "Year of birth is a required field";
    } else {
        profileAlerts.className = "";
        $.post( 
          "/user/saveprofile", 
          { profile: profileObj }
        ).done(function(response){
             if(response.success){ 
              profileAlerts.className = "";
              profileAlerts.className = 'alert alert-success';
              profileAlerts.innerHTML = response.msg;
             } else { 
                 profileAlerts.className = "";
                 profileAlerts.className = 'alert alert-danger';
                 profileAlerts.innerHTML = response.msg;
             }
          });
    } // end of if else make AJAX req

  }); // end of Save Profile click
  
}); // end of document.ready


/*
 * Autocomplete for location, Google Places API
 * 
 * Using window.load since getting Google Places JS file takes time,
 * the file needs to be fully loaded for autocomplete to work
 */ 

$(window).load(function(){

/*
  $('#autocomplete').removeClass('displayNone').addClass('displayInitial');
  $('#saveLoc').removeClass('displayNone').addClass('displayInitial');
  $('#editLoc').removeClass('displayNone').addClass('displayInitial');
*/
  var alerts_div = document.getElementById('profile_alerts');    
  
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
    alerts_div.className = ""; 
    alerts_div.innerHTML = "";    
    
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
   
  });
// End :: Autocomplete  

  $('#editLoc').on('click', function(){
    document.getElementById('saveLoc').removeAttribute('disabled');
    document.getElementById('autocomplete').removeAttribute('disabled');
  });


// Save location button
  $('#saveLoc').on('click', function(){
    // Clear alerts div of any class names or text
    alerts_div.className = ""; 
    alerts_div.innerHTML = "";   
    
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
          alerts_div.innerHTML = "Saving, please wait....";
        },
        success: function (data) {
          alerts_div.className = "alert alert-success";
          alerts_div.innerHTML = data;
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
          alerts_div.className = "alert alert-danger";
          alerts_div.innerHTML = "Error occurred. " + data.responseText; 
            //console.log('error. data is: \n');
            //console.log(data);
        }
        });

    } else { 
        alerts_div.className = "alert alert-danger";
        alerts_div.innerHTML = "Location is empty or autocomplete is inactive! Start typing city, wait for autocomplete";
    }
    
  }); // end of saveLoc click
      
}); // end of window load