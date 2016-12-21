$(document).ready(function(){   
  
  // Disable some elements to prevent from accidental
  // AJAX request and consequent connection to DB

  // Disable checkboxes
  $( ".checkbox-inline input:checkbox" ).each(function( index ) {
    $(this).attr('disabled', true);
  });
  
  // Disable text inputs
  $( "input:text" ).each(function( index ) {
    $(this).attr('disabled', true);
  });  

  // Disable textarea and Save Profile button
  $('textarea').prop('disabled', true);
  $('#saveProfile').prop('disabled', true);
  
  // On clicking Edit Profile enable all disabled elements
  $('#editProfile').on('click', function(){
    $( ".checkbox-inline input:checkbox" ).each(function( index ) {
      $(this).removeAttr('disabled');
    });
    
    $( "input:text" ).each(function( index ) {
      $(this).attr('disabled', false);
    });  
    
    $('textarea').prop('disabled', false);
    $('#saveProfile').prop('disabled', false);    
  }); // end of Edit Profile click
  
  var profileObj = { firstName: "",
                      showFirstName: true,
                      lastName: "",
                      showLastName: "",
                      yearOfBirth: 0000,
                      showYearOfBirth: true,
                      gender: "",
                      showGender: true,
                      aboutMe: ""
                    };
  var checkboxes = [ "showFirstName", 
                     "showLastName",
                     "showYearOfBirth",
                     "showGender"
                   ];
  var profileItems = [ "firstName",
                       "lastName",
                       "yearOfBirth",
                       "gender"
                     ];
                     
  var regex = new RegExp("^[a-zA-Z0-9 ]+$");
  var regexAboutMe = new RegExp("^[a-zA-Z0-9 !.,?()':;-]+$");
  
  // On clicking Save Profile collect all data from
  // text inputs, checkboxes, textarea and make an AJAX req
  $('#saveProfile').on('click', function(){
    var illegalChar = false;
   // Check if profile items are not empty and dont contain
   // illegal chars. 
    profileItems.forEach(function(element, index){
      var temp = $("#" + element).val().trim();
      if(temp){
        if(regex.test(temp)) {
          profileObj[element] = temp;
        } else { illegalChar = true; }
      }
    });
    
    if (regexAboutMe.test(($("#aboutMe").val().trim()))){ 
       profileObj["aboutMe"] = $("#aboutMe").val();
    } else { 
        illegalChar = true; 
    }
    
    // Collect checkbox values
    checkboxes.forEach(function(element, index){
      if ( $('#'+ element + ' input:checkbox').prop('checked') ){
        profileObj[element] = false;
      } else { 
        profileObj[element] = true;
      } 
    });

    console.log(profileObj);
//SAVING PROFILE WORKS NOW, MAKE SURE SANITIZING WORKS
//THEN PERSONAL PROFILE VS PUBLIC PROFILE
    var profileAlerts = document.getElementById("profileAlerts");
    alert("illegal char: " + illegalChar);
    // if illegal chars are found issue a warning msg
    if(illegalChar){
      // There are reported issues with jQuery removeClass
      // so using native DOM methods
      profileAlerts.className = "";
      profileAlerts.className = 'alert alert-danger';
      profileAlerts.innerHTML = "Only alphanumeric and certain punctuation marks are allowed";
    // if no illegal chars are found then make an ajax req and send ProfileObj
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