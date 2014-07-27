
var genReadableString = function(length) {
  /* Copyright: https://github.com/anthonyringoet/readable-random */
  var priv = {};
  priv.consonants = ['b','c','d','f','g','h','j','k','l','m','n','p','r','s','t','v','w'];
  priv.vowels = ['a', 'e', 'i', 'o', 'u'];
  priv.result = '';

  priv.getLetter = function(datasource){
    var key = Math.floor(Math.random() * datasource.length);
    return datasource[key];
  };

  // default and go
  var loopStat = 0;
  if(!length){
    length = 6;
  }

  while (loopStat < length){
    if(loopStat === null || loopStat % 2){
      priv.result += priv.getLetter(priv.vowels);
    }
    else{
      priv.result += priv.getLetter(priv.consonants);
    }
    loopStat++;
  }

  return priv.result;
};


ClientGlobal = {
  /* Usage:
   * ClientGlobal.guestId()
   */
    guestId: function() {
      var id = Session.get("guestId");
      if ( !id ) {

        var name = this.randomReadableString(4);
        var now = new Date().getTime();
        var guestData = {
          name: name,
          created: now
        };
        id = Guests.insert( guestData );
        console.log('New guestId:' + id + ', name:' + name);
        Session.set("guestId", id);
      }
      return id;
    },

    guestUser: function() {
      var guser = Guests.findOne({_id: this.guestId()});
      return guser;
    },

    testString: function() {
      return "testString from client.js";
    },
    activeTableId: function() {
      return Session.get("selected_table");
    },
    randomReadableString: function(length) {
      return genReadableString(length);
    },

    userDisplayName: function(user) {
      return user && user.profile && user.profile.name;
    },

    tableOwnerName: function(tableId) {

      var table = Tables.findOne({ _id: tableId});
      var userId  = table && table.creatorId;
      var name = userId && this.userDisplayName(Meteor.users.findOne( {_id: userId}));
      if ( name ) {
        return name;
      }

      var guestId = table && table.guestId;
      var guest = guestId && Guests.findOne({ _id: guestId});

      name = guest && guest.name;
      return name;
    }
};


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
  if ( name == null || name.length == 0) {
    var guest = ClientGlobal.guestUser();
      name = guest && guest.name;
    }
  return name;
});