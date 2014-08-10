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
ClientGlobal = {
    /* Usage:
     * ClientGlobal.guestId()
     */
    guestId : function() {

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
    userCanFinishOrderTableId: function(tableId) {
        var table = Tables.findOne({_id: tableId});
    
        var canRemove = table && table.creatorId && table.creatorId == Meteor.userId();
        if ( !canRemove ) {
          canRemove = table && table.guestId && table.guestId == ClientGlobal.guestId();
        }
        return canRemove;
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
    
    renameOrderMenuItem: function(newName, orderItemId) {
        
        console.log("changed menu name:" + newName + ", orderItemId:" + orderItemId);
        Session.set('editingOrderItemId', null);
        var order = Orders.findOne({_id: orderItemId});
        if ( order ) {
            var orders = Orders.find({name:order.name, tableId:order.tableId}).fetch();
            for(var i = 0; i < orders.length; i++) {
                Orders.update({_id:orders[i]._id}, {$set:{"name": newName}});
            }
            
            var table = Tables.findOne({_id: order.tableId});
            var menuOldName = table && table.placeId && Menus.findOne({placeId: table.placeId, name:order.name});
            if ( menuOldName ) {
                var menuNewName = table && table.placeId && Menus.findOne({placeId: table.placeId, name:newName});
                if ( menuNewName ) {
                    console.log( 'rename menu: update and remove merge:' + newName);
                    Menus.update({_id:menuNewName._id}, {$inc: {"count": menuOldName.count}});
                    Menus.remove({_id:menuOldName._id});
                } else {
                    console.log( 'rename menu: simple rename:' + newName);
                    Menus.update({_id:menuOldName._id}, {$set: {"name": newName}});
                }
            }
        } 
     },

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

UI.registerHelper("spinnerRunningMessage", function() {
    return "spinnerRunningMessage"; 
});

UI.registerHelper("userCanRemoveTableId", function(tableId) {
    var table = Tables.findOne({_id: tableId});

    var canRemove = table && Meteor.userId() !== null && table.creatorId == Meteor.userId();
    if ( !canRemove ) {
      canRemove = table && table.guestId == ClientGlobal.guestId();
    }
    return canRemove;
});

UI.registerHelper("orderTotalQty", function(tableId) {
      var orders = ClientGlobal.ordersSumForTableId(tableId);
      var qty = 0;
      _.each( orders, function(order) {
          qty += order.qty;
      });
      return qty;
});

UI.registerHelper("orderTotalCost", function(tableId) {
      var orders = ClientGlobal.ordersSumForTableId(tableId);
      var cost = 0;
      _.each( orders, function(order) {
          cost += order.price;
      });
      return cost;
});
UI.registerHelper("userCanReviewOrderTableId", function(tableId) {
    /*
     * canFinishOrder or
     * user has placed an order
     */
    var canReview = ClientGlobal.userCanFinishOrderTableId(tableId);
    if ( !canReview ) {
        if ( Meteor.userId()) {
            canReview = Orders.find({tableId: tableId, userId:Meteor.userId()}).count() > 0;
        } else {
            canReview = Orders.find({tableId: tableId, guestId:ClientGlobal.guestId()}).count() > 0;
        }
    }
    return canReview;
});

UI.registerHelper("userCanFinishOrderTableId", function(tableId) {
      return ClientGlobal.userCanFinishOrderTableId(tableId);
});
