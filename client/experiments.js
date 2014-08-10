/* experiments.js */

ExpButtonRows = new Meteor.Collection(null);

Template.experiments.helpers({
    rows : function() {
        console.log('experiments.rows:...');
        return ExpButtonRows.find();
    }
});

Template.experiments.created = function() {
    console.log('experiments.created() ...');
    if (ExpButtonRows.find().count() == 0) {
        ExpButtonRows.insert({
            text : 'Nearby',
            url : Router.routes['expNearby'].path()
        });
        ExpButtonRows.insert({
            text : 'Nearby - Map',
            url : Router.routes['expMap'].path()
        });
        ExpButtonRows.insert({
            text : 'Nearby - 4sq Venues',
            url : Router.routes['exp4sq'].path()
        });
    }
};

/* GoogleMaps */
var createMarker = function(place, map) {
    var marker = new google.maps.Marker({
        map : map,
        anchorPoint : new google.maps.Point(0, -29)
    });
    marker.setIcon(/** @type {google.maps.Icon} */( {
        url : place.icon,
        size : new google.maps.Size(71, 71),
        origin : new google.maps.Point(0, 0),
        anchor : new google.maps.Point(17, 34),
        scaledSize : new google.maps.Size(35, 35)
    }));
    marker.setPosition(place.geometry.location);
    marker.setVisible(true);
    return marker;    
};

var createInfoWindow = function(place, marker, map) {
    var infowindow = new google.maps.InfoWindow();
    var address = '';
    if (place.address_components) {
        address = [(place.address_components[0] && place.address_components[0].short_name || ''), (place.address_components[1] && place.address_components[1].short_name || ''), (place.address_components[2] && place.address_components[2].short_name || '')].join(' ');
    }
    
    infowindow.setContent('<div><strong><a href="#">' + place.name + '</a></strong><br>' + address);
        // + ' @' + place.geometry.location
    infowindow.open(map, marker);
    return infowindow;
};

var setupGoogleMapsAutoComplete = function(inputId, map) {
    var input = /** @type {HTMLInputElement} */(
        document.getElementById(inputId));
    var autocomplete = new google.maps.places.Autocomplete(input);
    autocomplete.bindTo('bounds', map);

    // var infowindow = new google.maps.InfoWindow();
    google.maps.event.addListener(autocomplete, 'place_changed', function() {
        var place = autocomplete.getPlace();
        if (!place.geometry) {
            return;
        }
        console.log('place:' + JSON.stringify(place));

        if (place.geometry.viewport) {
            map.fitBounds(place.geometry.viewport);
        } else {
            map.setCenter(place.geometry.location);
            map.setZoom(17);
            // Why 17? Because it looks good.
        }

        var marker = createMarker(place, map);
        var infowindow = createInfoWindow(place, marker, map);        
    });
}; 

var setupGoogleMapsSearcyNearby = function(inputId, map, latLng, callback) {
    // var input = /** @type {HTMLInputElement} */(
        // document.getElementById(inputId));
    var input = $(inputId);

    console.log('setupGoogleMapsSearcyNearby(): inputId:' + inputId + ', input:' + input);
            
    var request = {
        location : latLng,
        radius : '500',
        //types : ['store']
    };

    var keyword = input && input.val();
    if ( keyword && keyword.length ) {
        request['name'] = keyword;
    }
    
    service = new google.maps.places.PlacesService(map);
    service.nearbySearch(request, function(results, status) {
        if (status == google.maps.places.PlacesServiceStatus.OK) {
            for (var i = 0; i < results.length; i++) {
                var place = results[i];
                var marker = createMarker(results[i], map);
                if ( i == 0 ) {
                    createInfoWindow(results[i], marker, map);
                }
            }
            if ( callback ) {
                callback(results);
            }
        }
    });
}; 

var initGoogleMaps = function(callback) {
    Meteor.call('settings', function(error, result) {
        if ( error ) {
            console.log('error: reading settings:' + error);
            throwError('Cannot read settings: ' + error);            
        } else {
            var settings = result;
            GoogleMaps.init({
                'sensor' : true, //optional
                'key' : settings.googlemaps.key, //optional
                'libraries' : 'places',
            }, function() {
                var mapOptions = {
                    zoom : 15,
                    mapTypeId : google.maps.MapTypeId.ROADMAP
                };
                map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
                callback(map);
            });
        }
    });
};

//var googleMap = null;
NearbyPlaces = new Meteor.Collection(null);

var LocationUtil = {
    lastUpdatedLocation: null,
    
    googleMap: null,
    
    getLocation: function(callback) {
        /* callback(position)
         * - position: {coords: {latitude:..., longitude:}}
         */
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(location) {
                LocationUtil.lastUpdatedLocation = location;
                console.log( 'Location updated:' + JSON.stringify(LocationUtil.lastUpdatedLocation));
                if ( callback ) {
                    callback(location);
                }    
            });
        } else {
            throwError("Can't determine location");
        }
    },
    
    geoJsonPoint: function(lat, lon) {
      //return { type: "Point", coordinates: [ lon, lat ] };  
      return [ lon, lat ];  
    },
    
    showPosition: function(position) {
        var self = LocationUtil;
        if (self.googleMap) {
            console.log('showPosition(), googleMap:' + self.googleMap);
            var latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
            console.log('showPosition(), setCenter():' + JSON.stringify(latLng));
            self.googleMap.setCenter(latLng);        
        } else {
            throwError("google.maps.Map is not ready");
        }
    }
};

Template.expMap.created = function() {
    Session.set('mapAvailable', false);
    MapBounds.set({});    
};

Template.expMap.rendered = function() {
    initGoogleMaps(function(map) {
        LocationUtil.googleMap = map;
        LocationUtil.getLocation(function(location) {

            console.log('expMap.rendered(), location:' + JSON.stringify(location));
            LocationUtil.showPosition(location);
            
            google.maps.event.addListener(map, 'bounds_changed', function() {
                var bounds = map.getBounds();
                if ( bounds) {
                    MapBounds.set({
                        southWest: [ bounds.getSouthWest().lng(), bounds.getSouthWest().lat() ],
                        northEast: [ bounds.getNorthEast().lng(), bounds.getNorthEast().lat() ]
                    });
                    Session.set('mapAvailable', true);                        
                }        
            });
        });
        setupGoogleMapsAutoComplete('input-anyplace', map);
    });
};

Template.expMap.helpers( {
    nearbyPlaces: function() {
        return NearbyPlaces.find();   
    },
    
    mapBounds: function() {
        if ( Session.equals('mapAvailable', true) ) {            
            var bounds = LocationUtil.googleMap && LocationUtil.googleMap.getBounds();
            if ( bounds ) {                
                var mapBounds = {
                    center: {latitude:bounds.getCenter().lat(), longitude:bounds.getCenter().lng() },
                    northEast: {latitude:bounds.getNorthEast().lat(), longitude:bounds.getNorthEast().lng() },
                    southWest: {latitude:bounds.getSouthWest().lat(), longitude:bounds.getSouthWest().lng() },
                };
                console.log('expMap.mapBounds(): return:' + (mapBounds ? JSON.stringify(mapBounds) : mapBounds));
                return mapBounds;
            }
        }
    },
    
    placesInBounds: function() {
        console.log('expMap.placesInBounds()');
        return Places.find();
    }, 
});

Template.expMap.events( {
    'click .btn-nearby': function(e) {
        e.preventDefault();
        console.log('expMap.btn-nearby, googleMap:' + LocationUtil.googleMap);
        var input = $('#input-nearby');
        console.log('expMap.btn-nearby, input.val():' + input.val());
        
        if ( LocationUtil.googleMap ) {
                
                var latLng = LocationUtil.googleMap.getCenter(); 
                // new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                setupGoogleMapsSearcyNearby('input-nearby', LocationUtil.googleMap, latLng, function(places) {
                    NearbyPlaces.remove({});
                    for(var i = 0; i < places.length; i++) {
                        /* Conversion to Places from GoogleMaps PlaceResult */
                        var location = places[i].geometry.location;
                        places[i].coords = LocationUtil.geoJsonPoint(location.lat(), location.lng()); //{latitude: location.lat(), longitude: location.lng() };
                        places[i].ref = {service: 'googlemaps', id:places[i].id};
                        NearbyPlaces.insert(places[i]);                    
                    }
                });
        }
    },
    'click .btn-add-place': function(e) {
        e.preventDefault();
        var place = this;
        console.log('btn-add-place(), this:' + place.name + ', coords:' + JSON.stringify(place.coords));
        if (Places.find({coords: place.coords}).count() == 0 ) {
            console.log( 'New place: adding ' + place.name);
            Places.insert(_.pick(place, 'name', 'coords', 'ref'));        
        } else {
            console.log( 'Duplicate place: not adding ' + place.name);
        }
    }   
});

Template.expNearby.created = function() {
    /* request location information so it's update at LocationUtil.lastUpdatedLocation soon */
    LocationUtil.getLocation();
};

Template.expNearby.helpers( {
    nearbyPlaces: function() {
        if ( LocationUtil.lastUpdatedLocation ) {
            return Places.find();                        
        } else {
            return [];    
        }
    },    
});
