/* tables.js */
Meteor.subscribe("tables");
Meteor.subscribe("places");
Meteor.subscribe("guests");

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
				Router.go('tablePage', {_id: id});
			}
		} else if ( newTableName === null || newTableName.length == 0 ) {
		    input.val(ClientGlobal.randomReadableString(4).toUpperCase());
		    input.select();
		}
	},
	'click .view-old-orders': function(e) {
	    Session.set('placeIdViewingOldTables', this._id);
	},
    'click .hide-old-orders': function(e) {
        Session.set('placeIdViewingOldTables', null);
    }
	
});

Template.finishedTables.helpers({
    tables: function(placeId) {
        return Tables.find({placeId: placeId, finished:true}, {sort: {created: -1}});
    },
    placeIdViewingOldTables: function() {
        return Session.get('placeIdViewingOldTables') == this._id;
    }
});

Template.finishedTableRow.helpers({
    tableOwnerName: function() {
        return ClientGlobal.tableOwnerName(this._id);
    },
    createdDateString: function() {
        return ClientGlobal.dateStringFromTime(this.created);
    },
});

Template.tableMenu.helpers( {
	tables: function(placeId) {
		return Tables.find({placeId: placeId, finished:null});
	},
});

Template.tableMenuRow.helpers( {
	tableOwnerName: function() {
		return ClientGlobal.tableOwnerName(this._id);
	}
});

Template.breadCrumbTable.helpers( {
	placeName: function() {
	    //console.log('breadCrumbTable.placeName(), this:' + JSON.stringify(this));
	    if ( this ) {
            var place = Places.findOne({_id: this.placeId});
            return place && place.name;
	    }
	    return [];
	},
    editing: function() {
        return Session.equals('editingTableId', this._id);
    }
});

Template.breadCrumbTable.events( {
    'click .table-name': function(e, template) {
        Session.set('editingTableId', this._id);
        Deps.flush();
        var input = template.find('#table-name-edit');
        input.focus();
        input.select();
    },
    'focusout #table-name-edit': function(e) {
        Session.set('editingTableId', null);
        console.log('focusout.table-name-edit, target:' + $(e.target).val());
        var name = $(e.target).val();
        if ( name && name.length > 0 ) {
            Tables.update({_id:this._id}, {$set: {"name": name }});
        }
    }
});