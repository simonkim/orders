Orders = new Meteor.Collection("orders");


if (Meteor.isClient) {

}

if (Meteor.isServer) {
	Meteor.startup(function () {
    // code to run on server at startup
});
}


