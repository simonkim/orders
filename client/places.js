Template.places.helpers({
  places: function() {
    return Places.find();
  },
});

Template.places.rendered = function() {
    MapBounds.set({});    
};
