Template.places.helpers({
  places: function() {
      console.log('places.places()');
    return Places.find();
  },
});

Template.places.rendered = function() {
    MapBounds.set({});    
};
