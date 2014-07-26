Orders = new Meteor.Collection("orders");
Tables = new Meteor.Collection("tables");

/* Tables
 * - name
 * - created
 * - creatorId
 */

if (Meteor.isClient) {

}

if (Meteor.isServer) {
	Meteor.startup(function () {
    // code to run on server at startup
});
}


