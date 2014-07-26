/* tables.js */

var userDisplayName = function(user) {
    return user && user.profile && user.profile.name;
}

var activeTableId = function() {
	return Session.get("selected_table");
}

Template.tables.helpers( {
	tables: function() {
		return Tables.find();
	},
	tableActive: function() {
		return Session.equals("selected_table", this._id);
	},
	activeTableOwnerName: function() {
		var table = Tables.findOne({ _id: activeTableId()});
		var user  = null;
		user = table && Meteor.users.findOne({_id: table.creatorId});
		return userDisplayName(user);
	}
});

Template.removeTableButton.helpers( {
  activeTableId: function() {
  	return activeTableId();
  },
  canRemoveActiveTable: function() {
  	var table = null;
  	if ( Meteor.userId()) {
  		table = Tables.findOne({ _id: activeTableId(), creatorId: Meteor.userId()});
  	}
  	return table != null;

  },

  activeTableName: function() {
  	var table = Tables.findOne({_id: activeTableId()});
  	return table && table.name;
  }
});

Template.tables.events({
	'submit form': function(e) {
		e.preventDefault();
		var input = $(e.target).find('[id=newtable]');
		var newTableName = input.val();
		if ( Meteor.userId() && newTableName && newTableName.length > 0) {
			var now = new Date().getTime();
			var table = {
				name: newTableName,
				created: now,
				creatorId: Meteor.userId()
			};
			var id = Tables.insert(table);
			if ( id ) {
				Session.set("selected_table", id);
				input.val('');
			}
		}
	},

	'click .table': function (e) {
		Session.set("selected_table", this._id);
	},

	'click .remove-table': function(e) {
		Tables.remove({_id: activeTableId()});
		/* orders with removed tableId will be forgotten and not be queried */
		Session.set("selected_table", null);
	}

});