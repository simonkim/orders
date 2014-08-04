Orders = new Meteor.Collection("orders");
Tables = new Meteor.Collection("tables");
Places = new Meteor.Collection("places");
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
if (Meteor.isClient) {

}

if (Meteor.isServer) {
	Meteor.startup(function () {
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
}


