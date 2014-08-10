Router.configure({
  layoutTemplate: 'layout',
  //loadingTemplate: 'loading',
  waitOn: function() { return Meteor.subscribe('places', MapBounds.get()); }
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
  this.route('experiments', {
      path:'/experiments'
  });
  this.route('expNearby', {
      path:'/experiments/nearby'
  });
  this.route('expMap', {
      path:'/experiments/map'
  });
  this.route('exp4sq', {
    path:'/experiments/4sq' 
  });
});

//Router.onBeforeAction('loading');