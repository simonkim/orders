Template.commentEntry.events({
  'submit form': function(e) {
    e.preventDefault();
    var newComment = $(e.target).find('[id=newcomment]').val();
    var objectType = $(e.target).find('[id=objecttype]').val();
    var objectKey = $(e.target).find('[id=objectkey]').val();
    if ( newComment && newComment.length > 0 ) {
        var comment = {
            text: newComment,
            userId: Meteor.userId(),
            guestId: ClientGlobal.guestId(),
            createdDate: new Date().getTime(),
            objectType: objectType,
            objectKey: objectKey
        };
        console.log( 'new comment:' + JSON.stringify(comment));
        Comments.insert(comment);
        $(e.target).find('[id=newcomment]').val('');
    }
  }, 
  
});

Template.simpleCommentRow.events( {
    'click .remove-my-comment': function(e) {
        e.preventDefault();
        console.log("remove comment:" + this._id);        
        Comments.remove({_id: this._id});             
    }   
});

UI.registerHelper("simpleCommentsParamMain", function() {
   return {
       objectType: 'page', 
       objectKey: 'main'
   }; 
});

UI.registerHelper("comments", function(objectType, objectKey) {
   return Comments.find({objectType: objectType, objectKey: objectKey}, {sort:{ createdDate:-1}});
});

UI.registerHelper("canRemoveCommentWithIds", function(userId, guestId) {
    return ClientGlobal.isCurrentUserEither(userId, guestId);
});

UI.registerHelper("commentsMakeParam", function(type, key) {
   return { objectType:type, objectKey:key}; 
});
