var genReadableString = function(length) {
    /* Copyright: https://github.com/anthonyringoet/readable-random */
    var priv = {};
    priv.consonants = ['b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'r', 's', 't', 'v', 'w'];
    priv.vowels = ['a', 'e', 'i', 'o', 'u'];
    priv.result = '';

    priv.getLetter = function(datasource) {
        var key = Math.floor(Math.random() * datasource.length);
        return datasource[key];
    };

    // default and go
    var loopStat = 0;
    if (!length) {
        length = 6;
    }

    while (loopStat < length) {
        if (loopStat === null || loopStat % 2) {
            priv.result += priv.getLetter(priv.vowels);
        } else {
            priv.result += priv.getLetter(priv.consonants);
        }
        loopStat++;
    }

    return priv.result;
};

var ordersSumForTableId = function(tableId) {
    /* TODO: Make this server method */
    /* name, price, qty, userId[] */
    var orders = Orders.find( {tableId: tableId}, {sort: {name: 1}} ).fetch();
    var groups = _.groupBy( orders, function(order) {
        return order.name;
    });
    var ordersSum = [];
    var sumId = 0;
    /*
     * 1. group orders by name -> {name: orders[]}
     * 2. reduce each orders for the same name
     */
    _.each( groups, function(group, name, list) {
        /*
        group[0].users = [];
        group[0].guests = [];
        */
      group[0].details = []; /* userId, guestId, orderId */
      group[0].totalPrice = parseFloat(group[0].price);
      var sum = _.reduce(group, function(total, order) {
          if (total._id != order._id) {
              /* the first order becomes 'total' and 'qty's of all the other orders are accumulated to total.qty */
              total.qty += order.qty;
              total.totalPrice = parseFloat(total.totalPrice) + parseFloat(order.price);
          }
          var detail = _.pick(order, 'userId', 'guestId');
          detail.orderId = order._id;
          detail.user = Meteor.users.findOne({_id: order.userId});
          detail.guest = !detail.user && Guests.findOne({_id: order.guestId});
          total.details.push(detail);

          return total;
      }, group[0]);
      sum._id = sumId++;
      ordersSum.push(sum);
    });
    return ordersSum;
};
ClientGlobal = {
    /* Order table expires in 2 hours so anybody can delete or save */
    TIME_ORDERTABLE_EXPIRES_MS : (2 * 3600 * 1000),

/* Usage:
 * ClientGlobal.guestId()
 */
    guestId : function() {
        /* FIXME: Make it server method */
        var id = Session.get("guestId");
        if (!id) {
            var name = this.randomReadableString(4);
            var now = new Date().getTime();
            var guestData = {
                name : name,
                created : now
            };
            id = Guests.insert(guestData);
            console.log('New guestId:' + id + ', name:' + name);
            Session.set("guestId", id);
        }
        return id;

    },

    guestUser : function() {
        var guser = Guests.findOne({
            _id : this.guestId()
        });
        return guser;
    },

    testString : function() {
        return "testString from client.js";
    },
    activeTableId : function() {
        return Session.get("selected_table");
    },
    randomReadableString : function(length) {
        return genReadableString(length);
    },

    userDisplayName : function(user) {
        var name = null;
        name = user && user.profile && user.profile.name;
        return name;
    },
    
    userGuestDisplayNameWithIds : function(userId, guestId) {
        /* try meteor user and Guests table */
        var name = userId && this.userDisplayName(Meteor.users.findOne({
            _id : userId
        }));
        if (!name) {
            var guest = guestId && Guests.findOne({
                _id : guestId
            });
    
            name = guest && guest.name;
        }
        return name;
    },
    userCanRemoveTable: function(table) {
        var canRemove = table && table.creatorId && table.creatorId == Meteor.userId();
        if ( !canRemove ) {
            canRemove = table && table.guestId && table.guestId == ClientGlobal.guestId();
        }
        return canRemove;
    },
    userCanFinishOrderTableId: function(tableId) {
        var table = Tables.findOne({_id: tableId});
    
        var canFinish = this.userCanRemoveTable(table);
        if ( !canFinish ) {
            var now = new Date().getTime();
            canFinish = table && table.created < (now - this.TIME_ORDERTABLE_EXPIRES_MS);
        }
        return canFinish;
    },
    tableOwnerName : function(tableId) {

        var table = Tables.findOne({
            _id : tableId
        });

        return table && this.userGuestDisplayNameWithIds(table.creatorId, table.guestId);
    },
    
    isCurrentUserEither : function(userId, guestId) {
        return (Meteor.userId() && Meteor.userId() === userId) || (guestId && ClientGlobal.guestId() === guestId);        
    },
    
    ordersSumForTableId: function(tableId) {
        return ordersSumForTableId(tableId);
    },
    dateStringFromTime: function(time) {
        var date = new Date(time);
        return date.toLocaleDateString();
    },
    
    renameOrderMenuItem: function(newName, orderItemId, price) {
        /* TODO: Make this server method */
        console.log("changed menu name:" + newName + ", orderItemId:" + orderItemId + ", price:" + price);
        if ( !(price === 0 || price > 0) ) {
            price = 0;
        } else {
            price = parseFloat(price);
        }

        var order = Orders.findOne({_id: orderItemId});
        if ( order ) {
            var orders = Orders.find({name:order.name, tableId:order.tableId}).fetch();
            for(var i = 0; i < orders.length; i++) {
                Orders.update({_id:orders[i]._id}, {$set:{"name": newName, "price": price}});
            }
            
            var table = Tables.findOne({_id: order.tableId});
            var menuOldName = table && table.placeId && Menus.findOne({placeId: table.placeId, name:order.name});
            if ( menuOldName ) {
                var menuNewName = table && table.placeId && Menus.findOne({placeId: table.placeId, name:newName});
                if ( menuNewName  && menuNewName._id != menuOldName._id) {
                    console.log( 'rename menu: update and remove merge:' + newName + ', menuNewName:' + JSON.stringify(menuNewName));
                    Menus.update({_id:menuNewName._id}, {$inc: {"count": menuOldName.count}, $set: {"price": price}});
                    Menus.remove({_id:menuOldName._id});
                } else {
                    console.log( 'rename menu: simple rename:' + newName);
                    Menus.update({_id:menuOldName._id}, {$set: {"name": newName, "price": price}});
                }
            }
        } 
     },

    userGuestDisplayNameWithDetail: function(orderDetail) {
        /* detail keys: _id, user, guest, userId, guestId */

        var name = ClientGlobal.userDisplayName(orderDetail.user);
        if (name == null) {
            name = orderDetail.guest && orderDetail.guest.name;
        }
        return name;
    }
};

MapBounds = {
  get: function(){
      console.log('MapBounds.get(' + JSON.stringify(this) + ')');
      
        if (!this.dependency) {
          this.dependency = new Deps.Dependency();
        }
        this.dependency.depend();
        if (this.sw && this.ne)
          return { southWest : this.sw, northEast : this.ne };
  },

  set: function(bounds){
      console.log('MapBounds.set(' + JSON.stringify(bounds) + ')');
      
      if (!_.isEqual(bounds.southWest, this.sw) || !_.isEqual(bounds.northEast, this.ne)) {
        this.sw = bounds.southWest;
        this.ne = bounds.northEast;
        this.dependency.changed();
      }
  }
};

// Deps.autorun(function(){
    // Session.set('loading', true);
    // console.log('subscribing places...');
    // Meteor.subscribe('places', MapBounds.get(), function(){
        // Session.set('loading', false);
    // });;
// });    


UI.registerHelper("guestId", function() {
    //{{guestId}}
    return ClientGlobal.guestId();
});

UI.registerHelper("guestName", function() {
    //{{guestName}}
    var guser = ClientGlobal.guestUser();
    return guser && guser.name;
});

UI.registerHelper("displayName", function() {
    var name = ClientGlobal.userDisplayName(Meteor.user());
    if (name == null || name.length == 0) {
        var guest = ClientGlobal.guestUser();
        name = guest && guest.name;
    }
    return name;
}); 

UI.registerHelper("userGuestDisplayNameWithIds", function(userId, guestId) {
   return ClientGlobal.userGuestDisplayNameWithIds(userId, guestId); 
});

UI.registerHelper("userGuestDisplayNameWithDetail", function(orderDetail) {
    /* detail keys: _id, user, guest, userId, guestId */

    return ClientGlobal.userGuestDisplayNameWithDetail(orderDetail);
});

UI.registerHelper("spinnerRunningMessage", function() {
    return "spinnerRunningMessage"; 
});

UI.registerHelper("userCanRemoveTableId", function(tableId) {
    var table = Tables.findOne({_id: tableId});

    return ClientGlobal.userCanRemoveTable(table);
});

UI.registerHelper("orderTotalQty", function(tableId) {
      var orders = ClientGlobal.ordersSumForTableId(tableId);
      var qty = 0;
      _.each( orders, function(order) {
          qty += order.qty;
      });
      return qty;
});

UI.registerHelper("orderTotalPrice", function(tableId) {
    var orders = ClientGlobal.ordersSumForTableId(tableId);
    var price = 0;
    _.each( orders, function(order) {
        price += parseFloat(order.price);
    });
    return price;
});

UI.registerHelper("orderTotalCost", function(tableId) {
      var orders = ClientGlobal.ordersSumForTableId(tableId);
      var cost = 0;
      _.each( orders, function(order) {
          cost += order.price;
      });
      return cost;
});

UI.registerHelper("userCanFinishOrderTableId", function(tableId) {
      return ClientGlobal.userCanFinishOrderTableId(tableId);
});
