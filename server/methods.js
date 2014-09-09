var queryPriceForMenuName = function(menuName) {
    var price = 0;
    var menu = Menus.findOne({name: menuName});
    price = (menu && menu.price) || 0;
    if ( price == 0 ) {
        var order = Orders.findOne({name: menuName});
        price = (order && order.price) || 0;
    }
    return price;
};

Meteor.methods( {
    insertOrder: function(tableId, menuName, guestId) {
        /* TODO: Make this server method */
        if (tableId && menuName && guestId) {

            var price = queryPriceForMenuName(menuName);
            var order = {
                name: menuName,
                qty: 1,
                price: price,
                userId: Meteor.userId(),
                guestId: guestId,
                tableId: tableId
            };
            console.log('insertOrder():' + JSON.stringify(order));
            return Orders.insert(order);
        } else {
            throw new Meteor.error(400, 'Arguments are not valid:' + JSON.stringify({tableId: tableId, menuName: menuName, guestId: guestId}));
        }
    },
});