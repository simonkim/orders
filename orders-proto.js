Orders = new Meteor.Collection("orders");
Tables = new Meteor.Collection("tables");
Places = new Meteor.Collection("places");
/* 
 * Places
 * - name
 * - coords { type: "Point", coordinates: [ lon, lat ] }
 * - ref { service: <googlemaps, 4sq, facebook, ...>, id: <object id of this place from the service> }
 */

Guests = new Meteor.Collection("guests");
Comments = new Meteor.Collection("comments");
Menus = new Meteor.Collection("menus");
/* Tables
 * - name
 * - created
 * - creatorId
 */

/* Comments
 * - text
 * - userId
 * - guestId
 * - createdDate
 * - objectType: place, table, menu, page
 * - objectKey: id (objectType= place, table, or menu), 'home', 'about', '<any unique string>' (objectType: page)
 */

if (Meteor.isServer) {
	Meteor.startup(function () {
	    
    Future = Npm.require('fibers/future');
	    
        // code to run on server at startup
        if (Places.find().count() === 0) {
            var placesData = [
                {
                    name: "Cafe 3.5"
                },
                {
                    name: "Test - Friday Bistro"
                },
                {
                    name: "Test - Beer Factory"
                },
            ];
    
            for( var i = 0; i < placesData.length; i++) {
                Places.insert(placesData[i]);
            }
        }    
    });
    
    Places._ensureIndex({'coords':'2d'});
    
    Meteor.publish('places', function(bounds){
        if (bounds && bounds.southWest && bounds.northEast) {
            console.log('publish:places, bounds:' + JSON.stringify(bounds));
            return Places.find({'coords': {'$within' :
               { '$box' : [bounds.southWest, bounds.northEast] }
            }});
        } else {
            return Places.find();
        }
    });
    
    Meteor.publish("orders", function () {
        return Orders.find(); // everything
    });    
    Meteor.publish("tables", function () {
        return Tables.find(); // everything
    });    
    Meteor.publish("guests", function () {
        return Guests.find(); // everything
    });    
    Meteor.publish("comments", function () {
        return Comments.find(); // everything
    });    
    Meteor.publish("menus", function () {
        return Menus.find(); // everything
    });    
    
    Meteor.methods({
      settings: function () {
          return JSON.parse(Assets.getText('settings.json'));
      },    
    });    
}


