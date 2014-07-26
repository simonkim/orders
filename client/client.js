
function userDisplayName(user) {
    return user && user.profile && user.profile.name;
}

var activeTableId = function() {
  return Session.get("selected_table");
}

Template.ordersAll.helpers({
  orders: function() {
    /* name, price, qty, userId[] */
    var orders = Orders.find( {tableId: activeTableId()}, {sort: {name: 1}} ).fetch();
    var groups = _.groupBy( orders, function(order) {
        return order.name;
    });
    var ordersSum = [];

    /*
     * 1. group orders by name -> {name: orders[]}
     * 2. reduce each orders for the same name
     */
    _.each( groups, function(orders, name, list) {
      orders[0].users = [];
      var sum = _.reduce(orders, function(total, order) {
        if ( total._id != order._id) {
          total.qty += order.qty;
        }

        var user = Meteor.users.findOne({_id: order.userId});
        if ( user ) {
          total.users.push(user);
        }
        return total;
      }, orders[0]);
      ordersSum.push(sum);
    });
    return ordersSum;
  },
  ordersAll: function() {
    return Orders.find( {tableId: activeTableId()}, {sort: {name: 1}} );
  },
});

Template.ordersMine.helpers({
  orders: function() {
    return Orders.find( {userId: Meteor.userId(), tableId: activeTableId()}, {sort: {name: 1}} );
  }
});


Template.orderItem.helpers({
  userDisplayName: function(user) {
    var name = userDisplayName(user);
    if ( name == null || name.length == 0) {
      name = "unknown";
    }
    return name;
  },
})

Template.userProfile.helpers({
    displayName: function () {
    var name = userDisplayName(Meteor.user());
    if ( name == null || name.length == 0) {
      name = "unknown";
    }
    return name;
  }
});

Template.userProfile.events({
  'submit form': function(e) {
    e.preventDefault();
    var displayName = $(e.target).find('[id=displayName]').val();
    if ( displayName && displayName.length > 0) {
        Meteor.users.update({_id:Meteor.user()._id}, {$set:{"profile.name": displayName}})
    }
  },
});

Template.main.greeting = function () {
  return "Welcome to orders-proto.";
};

Template.orderItemMine.events({
  'click .remove-my-order': function(e) {
      Orders.remove({_id: this._id});
  },
});
Template.main.events({
  'click .label': function (e) {
    /* TODO: click the label -> prepare to enter as the new menu to add */
  },

});

Template.main.helpers({
});

Template.addMenuRow.events({
  'submit form': function(e) {
    e.preventDefault();
    /*
      - Take the input text
      - Add the menu to the order list
      - clear the text input
      */

      var neworder = $(e.target).find('[id=neworder]').val();
      var tableId = activeTableId();
      if ( tableId && neworder && neworder.length > 0) {

        var order = {
          name: neworder,
          qty: 1,
          price: 0,
          userId: Meteor.userId(),
          tableId: tableId
        }

        $(e.target).find('[id=neworder]').select();
        Orders.insert(order);
      } else {
        console.log( 'Table not specified');
      }

}
});

