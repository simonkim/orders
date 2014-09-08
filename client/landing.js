
Template.landing.helpers( {
    version: function() {
        var ver = Session.get("app_version");
        if ( !ver ) {
            Meteor.call('version', function (error, result) {
                if (error) {
                    console.log('error: determining version:' + error);
                    throwError('Cannot read settings: ' + error);
                } else {
                    Session.set("app_version", result);
                }
            });
        }
        return ver;
    }
})