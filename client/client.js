

/* orders */
Template.ordersAll.helpers({
  orders: function(tableId) {
    /* name, price, qty, userId[] */
    var orders = Orders.find( {tableId: tableId}, {sort: {name: 1}} ).fetch();
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
      orders[0].guests = [];
      var sum = _.reduce(orders, function(total, order) {
        if ( total._id != order._id) {
          total.qty += order.qty;
        }

        var user = Meteor.users.findOne({_id: order.userId});
        if ( user ) {
          total.users.push(user);
        } else {
          var guest = Guests.findOne({_id: order.guestId});
          if ( guest ) {
            total.guests.push(guest);
          }
        }

        return total;
      }, orders[0]);
      ordersSum.push(sum);
    });
    return ordersSum;
  },
  ordersAll: function(tableId) {
    return Orders.find( {tableId: tableId}, {sort: {name: 1}} );
  },
});

Template.orders.events( {
  'click .menu-name': function (e) {
    /* TODO: click the label -> prepare to enter as the new menu to add */
    console.log( 'clicked menu:' + e.target.innerHTML);
    var input = $("#add-menu #neworder");
    console.log( 'neworder:' + input.val());
    input.val(e.target.innerHTML);
    input.select();

  },
});
Template.ordersMine.helpers({
  orders: function(tableId) {
    var list;
    if ( Meteor.userId() ) {
      list = Orders.find( {userId: Meteor.userId(), tableId: tableId}, {sort: {name: 1}} );
    } else {
      list = Orders.find( {guestId: ClientGlobal.guestId(), tableId: tableId}, {sort: {name: 1}} );
    }
    return list;
  }
});


Template.orderItem.helpers({
  userDisplayName: function(user) {
    var name = ClientGlobal.userDisplayName(user);
    if ( name == null || name.length == 0) {
      name = "unknown";
    }
    return name;
  },
})

Template.orderItem.events( {

});

Template.orderItemMine.events({
  'click .remove-my-order': function(e) {
      Orders.remove({_id: this._id});
  },
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
      var tableId = $(e.target).find('[id=tableId]').val();

      if ( tableId && neworder && neworder.length > 0) {
        var order = {
          name: neworder,
          qty: 1,
          price: 0,
          userId: Meteor.userId(),
          guestId: ClientGlobal.guestId(),
          tableId: tableId
        }

        $(e.target).find('[id=neworder]').val('');
        Orders.insert(order);
      } else {
        console.log( 'Table not specified');
      }

}
});

Template.removeOrderTableButton.helpers( {
  canRemoveTableId: function(tableId) {
    var table = Tables.findOne({_id: tableId});

    var canRemove = table && table.creatorId == Meteor.userId();
    if ( !canRemove ) {
      canRemove = table && table.guestId == ClientGlobal.guestId();
    }
    return canRemove;
  },
  tableName: function() {
    return Tables.findOne({_id: this._id}).name;
 
  }
});

Template.removeOrderTableButton.events( {
  'click .remove-table': function(e) {
    Tables.remove({_id: this._id});
    Router.go('placePage', {_id: this.placeId});
  }
});
/* misc. */

Template.main.greeting = function () {
  return "Welcome to orders-proto.";
};

Template.main.events({
  'click .label': function (e) {
    /* TODO: click the label -> prepare to enter as the new menu to add */
    console.log( 'clicked label:' + e.target.value);
  },

});

Template.main.helpers({
});

Template.userProfile.events({
  'submit form': function(e) {
    e.preventDefault();
    var displayName = $(e.target).find('[id=displayName]').val();
    if ( displayName && displayName.length > 0) {
      if ( Meteor.userId() ) {
        Meteor.users.update({_id:Meteor.user()._id}, {$set:{"profile.name": displayName}})
      } else {
        Guests.update({_id: ClientGlobal.guestId()}, {$set:{"name": displayName}});
      }
    }
  },
});