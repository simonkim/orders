Meteor.subscribe("orders");
Meteor.subscribe("menus");
Meteor.subscribe("guests");

var menuAddCountOrInsert = function(menu) {
    var m = Menus.findOne({name:menu.name, placeId:menu.placeId});
    if (m) {
        console.log( 'menu:' + m.name + ", count:" + (m.count +1));
        Menus.update({_id: m._id}, {$inc:{"count": 1}});
    } else {
        Menus.insert(menu);
    }    
};

Template.reviewPage.events( {
  'click .review-ok': function (e) {
    /* update the table: finished */
    console.log( 'review-ok: ' + this._id + ',name:' + this.name, 'placeId:' + this.placeId);
    var placeId = this.placeId;
    var orders = Orders.find({tableId:this._id}).fetch();
    _.each( orders, function(order) {
        console.log('order.name:' + order.name + ', placeId:' + placeId);
        // Menus(placeId, name, price, count)
        var menu = {
            placeId: placeId,
            name: order.name,
            price: order.price,
            count: order.qty
        };
        menuAddCountOrInsert(menu);
    });
    
    Tables.update({_id: this._id}, {$set:{"finished": true}});
    Router.go('placePage', {_id: this.placeId});
  },
  
  'click .review-cancel': function (e) {
    /* update the table: finished */
    console.log( 'review-cancel: ' + this._id);
    Router.go('tablePage', {_id: this._id});
  },
});

Template.reviewOrdersAll.helpers({
  orders: function(tableId) {
    return ClientGlobal.ordersSumForTableId(tableId);
  },
});

Template.reviewOrderItem.helpers({
    userDisplayName: function(user) {
        var name = ClientGlobal.userDisplayName(user);
        if ( name === null) {
          name = "?";
        }
        return name;
    },  
});