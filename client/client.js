
/* misc. */
Meteor.subscribe("guests");

Template.nearby.events({
  'click .label': function (e) {
    /* TODO: click the label -> prepare to enter as the new menu to add */
    console.log( 'clicked label:' + e.target.value);
  },

});

Template.nearby.helpers({
});

/* userProfile */
function updateDisplayName(displayName) {
    var result = 0;
    if (displayName && displayName.length > 0) {
        console.log('updateDisplayName(' + displayName + ')');
        if (Meteor.userId()) {
            result = Meteor.users.update({_id: Meteor.user()._id}, {$set: {"profile.name": displayName}});
        } else {
            var guestId = ClientGlobal.guestId();
            result = Guests.update({_id: guestId}, {$set: {"name": displayName}});
        }
    }
    return result;
}

function displayNameSetEditMode(editMode) {
    if ( editMode ) {
        /* text field */
      $('.name-edit').addClass('hidden');
      $('.name-ok').removeClass('hidden');
      $('.name-input').removeClass('hidden').select();        
    } else {
        /* text label */
      $('.name-edit').removeClass('hidden');
      $('.name-ok').addClass('hidden');
      $('.name-input').addClass('hidden');
    }
}

Template.userProfileForm.events({
  'submit form': function(e) {
    e.preventDefault();
    var displayName = $(e.target).find('[id=displayName]').val();
    updateDisplayName(displayName);
    displayNameSetEditMode(false);
  },
});
Template.userProfile.events({

  'click .name-edit': function(e) {
      e.preventDefault();
      displayNameSetEditMode(true);
  },
  
  'click .name-ok': function(e) {
      e.preventDefault();
      var displayName = $('.name-input').val();
      updateDisplayName(displayName);
      displayNameSetEditMode(false);
  }
  
});


