
/* misc. */

Template.main.greeting = function () {
  return "Welcome to orders-proto.";
};

Template.main.events({
  'click .label': function (e) {
    /* TODO: click the label -> prepare to enter as the new menu to add */
    console.log( 'clicked label:' + e.target.value);
  },

});

Template.main.helpers({
});

/* userProfile */
function updateDisplayName(displayName) {
    if ( displayName && displayName.length > 0) {
      console.log( 'updateDisplayName(' + displayName + ')');  
      if ( Meteor.userId() ) {
        Meteor.users.update({_id:Meteor.user()._id}, {$set:{"profile.name": displayName}});
      } else {
        Guests.update({_id: ClientGlobal.guestId()}, {$set:{"name": displayName}});
      }
    }
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

Template.userProfile.events({
  'submit form': function(e) {
    e.preventDefault();
    var displayName = $(e.target).find('[id=displayName]').val();
    updateDisplayName(displayName);
    displayNameSetEditMode(false);
  },
  
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
