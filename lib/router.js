Router.configure({
  layoutTemplate: 'layout',
  //loadingTemplate: 'loading',
  //waitOn: function() { return Places.find().fetch(); }
});

Router.map(function() {
  this.route('main', {path: '/'});
  this.route('placePage', {
  	path: '/places/:_id',
  	data: function() { return Places.findOne(this.params._id); }
  });
  this.route('tablePage', {
  	path: '/tables/:_id',
  	data: function() { return Tables.findOne(this.params._id); }
  });
  this.route('reviewPage', {
    path: '/reviews/:_id',
    data: function() { return Tables.findOne(this.params._id); }
  });
  /* /table/:_id */
});

//Router.onBeforeAction('loading');