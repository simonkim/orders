
var ordersSumForTableId = function(tableId) {
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
};

/* orders */
Template.ordersAll.helpers({
  orders: function(tableId) {
    return ordersSumForTableId(tableId);
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
  
  'click .order-item': function (e) {
      /* Select order item for editing */
        if (Session.get('editingOrderItemId') === this._id) {
            Session.set( 'editingOrderItemId', null);
        } else {
            Session.set( 'editingOrderItemId', this._id);        
        }
  },
  
  'click .order-item-edit-cancel': function(e) {
    Session.set('editingOrderItemId', null);
  },
  
  'click .order-item-edit-ok': function(e) {
    var input = $("#order-item-name");
    var newName = input.val();
    if ( newName && newName.length > 0) {
        var orderItemId = this._id;
        console.log("changed menu name:" + input.val());
        Session.set('editingOrderItemId', null);
        var order = Orders.findOne({_id: orderItemId});
        if ( order ) {
            var orders = Orders.find({name:order.name, tableId:order.tableId}).fetch();
            for(var i = 0; i < orders.length; i++) {
                Orders.update({_id:orders[i]._id}, {$set:{"name": newName}});
            }
        }
    }
  },
  
  'click .order-item-metoo': function(e) {
        Session.set('editingOrderItemId', null);
        console.log( "me too:" + this.name);
        var order = {
          name: this.name,
          qty: 1,
          price: 0,
          userId: Meteor.userId(),
          guestId: ClientGlobal.guestId(),
          tableId: this.tableId
        };

        Orders.insert(order);      
  },
});

Template.orders.helpers({
   itemEditing: function(orderId) {
       console.log( 'itemEditing:' + orderId);
       return true;
   } 
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
  
    itemEditing: function(orderItemId) {
        return Session.equals('editingOrderItemId', orderItemId);       
    } 
  
});

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
        };

        $(e.target).find('[id=neworder]').val('');
        Orders.insert(order);
      } else if ( neworder === null || neworder.length == 0 ) {
         $(e.target).find('[id=neworder]').select(); 
      } else {
        console.log( 'Table not specified');
      }

}
});

Template.finishOrderButton.helpers({
  orders: function(tableId) {
    return ordersSumForTableId(tableId);
  },
  
  canFinishTableId: function(tableId) {
    var table = Tables.findOne({_id: tableId});

    var canRemove = table && table.creatorId == Meteor.userId();
    if ( !canRemove ) {
      canRemove = table && table.guestId == ClientGlobal.guestId();
    }
    return canRemove;
  },
  
});

Template.finishOrderButton.events( {
  'click .finish-review-orders': function(e) {
      /* update the table: finished */
        // Tables.update({_id: this._id}, {$set:{"finished": true}});
      /* Redirect to review orders page */    
        // Router.go('review', {_id: this._id});
  }    
});

Template.cancelOrderButton.helpers( {
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

Template.cancelOrderButton.events( {
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

/* userProfile */
function updateDisplayName(displayName) {
    if ( displayName && displayName.length > 0) {
      console.log( 'updateDisplayName(' + displayName + ')');  
      if ( Meteor.userId() ) {
        Meteor.users.update({_id:Meteor.user()._id}, {$set:{"profile.name": displayName}});
      } else {
        Guests.update({_id: ClientGlobal.guestId()}, {$set:{"name": displayName}});
      }
    }
}

function displayNameSetEditMode(editMode) {
    if ( editMode ) {
        /* text field */
      $('.name-edit').addClass('hidden');
      $('.name-ok').removeClass('hidden');
      $('.name-input').removeClass('hidden').select();        
    } else {
        /* text label */
      $('.name-edit').removeClass('hidden');
      $('.name-ok').addClass('hidden');
      $('.name-input').addClass('hidden');
    }
}
Template.userProfile.events({
  'submit form': function(e) {
    e.preventDefault();
    var displayName = $(e.target).find('[id=displayName]').val();
    updateDisplayName(displayName);
    displayNameSetEditMode(false);
  },
  
  'click .name-edit': function(e) {
      e.preventDefault();
      displayNameSetEditMode(true);
  },
  
  'click .name-ok': function(e) {
      e.preventDefault();
      var displayName = $('.name-input').val();
      updateDisplayName(displayName);
      displayNameSetEditMode(false);
  }
  
});
