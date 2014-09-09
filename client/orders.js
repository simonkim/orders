/* local APIs */

Meteor.subscribe("orders");
Meteor.subscribe("menus");
Meteor.subscribe("guests");
Meteor.subscribe("comments");


var insertOrder = function(menuName, tableId) {
    Meteor.call('insertOrder', tableId, menuName, ClientGlobal.guestId(), function(error, result) {
        if ( error ) {
            throwError('Can\'t add order: ' + error);
        } else if ( result ) {
            console.log('insertOrder:' + result);
        }
    });
};

var menuAddCountOrInsert = function(menu) {
    var m = Menus.findOne({name:menu.name, placeId:menu.placeId});
    if (m) {
        console.log( 'menu:' + m.name + ", count:" + (m.count +1));
        Menus.update({_id: m._id}, {$inc:{"count": 1}});
    } else {
        Menus.insert(menu);
    }
};

var finishOrdersWithTableId = function(tableId, placeId) {
    var orders = Orders.find({tableId:tableId}).fetch();
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

    Tables.update({_id: tableId}, {$set:{"finished": true}});
};

/* orders */
Template.ordersAll.helpers({
  orders: function(tableId) {
    return ClientGlobal.ordersSumForTableId(tableId);
  },
  ordersAll: function(tableId) {
    return Orders.find( {tableId: tableId}, {sort: {name: 1}} );
  },
  ordersOpen: function() {
        return this.finished !== true;
  }
});

Template.orders.events( {
  'click .menu-name-mine': function (e) {
    /* TODO: click the label -> prepare to enter as the new menu to add */
    console.log( 'clicked menu:' + e.target.innerHTML);
    var input = $("#add-menu #neworder");
    console.log( 'neworder:' + input.val());
    input.val(e.target.innerHTML);
    input.select();

  },
  
  'click .order-empty': function (e) {
      /* TODO: query the most recommended menu of this place and put it to the input */
    var input = $("#add-menu #neworder");
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
  
  'click .order-item-edit-ok': function(e) {
    var input = $("#order-item-name");
    var newName = input.val();
    if ( newName && newName.length > 0) {
        var orderItemId = this._id;
        
        ClientGlobal.renameOrderMenuItem(newName, orderItemId);
    }
  },
  
  'click .order-item-metoo': function(e) {
        insertOrder(this.name, this.tableId);
  },

    'click .order-item-edit-close': function(e) {
        Session.set( 'editingOrderItemId', null);
    }
});


Template.orders.helpers({
   ordersOpen: function() {
       return this.finished !== true;
   },
    createdDateString: function() {
        return ClientGlobal.dateStringFromTime(this.created);
    },
});

Template.orderItem.helpers({
    itemEditing: function(orderItemId) {
        var result = Session.equals('editingOrderItemId', orderItemId);
        return result;
    },
});

Template.orderItem.events( {
});

Template.orderItemEditRows.events( {
    'submit form': function(e) {
        e.preventDefault();
        var newName = $("#order-item-name").val();
        var price = $("#order-item-price").val();
        var orderItemId = null;
        if (this.details && this.details.length > 0) {
            orderItemId = this.details[0].orderId;
        }
        if ( orderItemId && newName && newName.length > 0) {
            ClientGlobal.renameOrderMenuItem(newName, orderItemId, price);
        }
    },
    'focusout #order-item-price': function(e) {
        var newName = $("#order-item-name").val();
        var price = $("#order-item-price").val();
        var orderItemId = null;
        if (this.details && this.details.length > 0) {
            orderItemId = this.details[0].orderId;
        }
        if ( orderItemId && newName && newName.length > 0) {
            ClientGlobal.renameOrderMenuItem(newName, orderItemId, price);
        }
    }
});

Template.orderItemDetailEditRow.events( {
    'click .order-item-edit-remove': function(e) {
        /*this: orderDetail { orderId, userId, guestId, user, guest } */
        Orders.remove({_id: this.orderId});
    },
    'click #order-detail-label': function(e, template) {
        if (Template.orderItemDetailEditRow.isUserOwnerOfOrderItemDetail(this)) {
            Session.set('editingOrderId', this.orderId);
            Deps.flush();
            var input = template.find('#order-detail-label-edit');
            input.focus();
            input.select();
        }
    },
    'focusout #order-detail-label-edit': function(e) {
        /* TODO: Apply the changed label for this order item */
        Session.set('editingOrderId', null);
    }
});
Template.orderItemDetailEditRow.helpers( {
    isUserOwnerOfOrderItemDetail: function(orderDetail) {
        /*this: orderDetail { orderId, userId, guestId, user, guest } */
        var owner = false;
        if ( Meteor.userId() ) {
            owner = orderDetail && Meteor.userId() && Meteor.userId() == orderDetail.userId;
        } else {
            owner = orderDetail && ClientGlobal.guestId() == orderDetail.guestId;
        }
        return owner;
    },
    label: function() {
        //return this.label || this.guest.name;
        return this.labe || ClientGlobal.userGuestDisplayNameWithDetail(this);
    },
    editing: function() {
        return Session.equals('editingOrderId', this.orderId);
    }
});

Template.addMenuRow.events({
  'submit form': function(e) {
    e.preventDefault();

      var neworder = $(e.target).find('[id=neworder]').val();
      var tableId = $(e.target).find('[id=tableId]').val();

      if ( tableId && neworder && neworder.length > 0) {
        $(e.target).find('[id=neworder]').val('');
        insertOrder(neworder, tableId); 

      } else if ( neworder === null || neworder.length == 0 ) {
         $(e.target).find('[id=neworder]').select(); 
      } else {
        console.log( 'Table not specified');
      }

}
});

Template.orderMainButtons.helpers({
   ordersOpen: function() {
       return this.finished !== true;
   } 
});

Template.saveOrderButton.helpers({
  orders: function(tableId) {
    return ClientGlobal.ordersSumForTableId(tableId);
  },
});

Template.saveOrderButton.events( {
  'click .save-order': function(e) {
      /* forget what was being edited so it does not affect review page */
    Session.set('editingOrderItemId', null);
    finishOrdersWithTableId(this._id, this.placeId);
    Router.go('placePage', {_id: this.placeId});  }
});

Template.removeOrdersButton.events( {
  'click .remove-table': function(e) {
    Tables.remove({_id: this._id});
    Router.go('placePage', {_id: this.placeId});
  }
});

Template.popularMenus.events( {
    'click .popular-menu-item': function(e, template) {
        var id = insertOrder(this.name, template.data._id);
    },
    'click .show-popular-menus': function(e) {
        Session.set('tableIdViewingPopularOrders', this._id);
    },    
    'click .hide-popular-menus': function(e) {
        Session.set('tableIdViewingPopularOrders', null);
    }    
});
Template.popularMenus.helpers( {
    popularMenus: function() {
        return this && this.placeId && Menus.find({placeId: this.placeId}, {sort: {count: -1}});
    },
    
    viewingPopularOrders: function() {
        return Session.get('tableIdViewingPopularOrders') == this._id;
    }
});
