/* tables.js */

Template.tables.events({
	'submit form': function(e) {
		e.preventDefault();
		var input = $(e.target).find('[id=newtable]');
		var newTableName = input.val();
		var userId = Meteor.userId();
		var guestId = ClientGlobal.guestId();
		var placeId = $(e.target).find('[id=placeId]').val();

		console.log('submit(): placeId:' + placeId);
		if ( placeId && (userId || guestId) && newTableName && newTableName.length > 0) {
			var now = new Date().getTime();
			var table = {
				name: newTableName,
				created: now,
				placeId: placeId
			};
			if ( userId ) {
				table["creatorId"] = userId;
			} else {
				table["guestId"] = guestId;
			}
			var id = Tables.insert(table);
			if ( id ) {
				Session.set("selected_table", id);
				input.val('');
			}
		}
	},
});

Template.tableMenu.helpers( {
	tables: function(placeId) {
		return Tables.find({placeId: placeId});
	},
});

Template.tableMenuRow.helpers( {
	tableOwnerName: function() {
		return ClientGlobal.tableOwnerName(this._id);
	}
});

Template.tablePage.helpers( {
	placeName: function() {
		var place = Places.findOne({_id: this.placeId});
		return place && place.name;
	}
});