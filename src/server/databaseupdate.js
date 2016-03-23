function issmaller( item , major, minor ) {
  return (item.major <= major && item.minor < minor );
}

function writeversion( major, minor, changes ) {
  Versions.insert({major:major,minor:minor,date:new Date(),changes:changes });
  console.log("update to version "+major+"."+minor);
}

function onVersion( current, major, minor, script, changes ) {
  if( issmaller( current, major, minor ) ) {
    script();
    writeversion(major, minor, (changes) ? changes:[] );
  }
}

Meteor.startup( function () {
  console.log("check database version");
  var last = Versions.findOne({$query: {}, $orderby:{ date: -1 } } );
  if( last == null ) {
    last = {major:0,minor:0,date:new Date(0),changes:[] };
  }

  // check for admin account ...
  var admin = Meteor.users.findOne({ isServerAdmin:true })
  if( admin == null ) {
    var uid = Accounts.createUser( { 'email': "admin@host.local", profile:{firstname: "Server", surname: "Admin" } } );
    Meteor.users.update({_id:uid},{$set: { 'isServerAdmin':true }});
    Accounts.setPassword(uid, "xep624")
    console.log("Create Default Server Admin ",  "admin@host.local" )
  }

  var def = Customers.findOne();
  if( def == null ) {
    var dep = Random.id();
    var departments = {};
    departments[ dep ] = {
      name: {
        short:"BLN",
        long:"Berlin"
      },
      roles: {
        admin : {
            "type" : 0,
            "location" : {
                "type" : "Point",
                "coordinates" : [
                    13,
                    52
                ]
            },
            "inviteroles" : []
        }
      }
    };
    var cust = Customers.insert({
      name: {
        short:'ARC',
        long:'Arc Greenlab'
      },
      enabled: true,
      departments : departments,
      mapconfig : {
        "projection" : {
          "name" : "EPSG:25833",
          "code" : "+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"
          },
          "layer" : [
              {
                  "name" : "Forstgrundkarte",
                  "ollayers" : [
                      {
                          "server" : "Geoserver",
                          "attribution" : "<a href=\"http://www.brandenburg-forst.de\">© LFB Forstgrundkarte | www.brandenburg-forst.de</a> ",
                          "url" : "http://www.brandenburg-forst.de:8080/geoserver/wms_ext/wms",
                          "opacity" : 1,
                          "params" : {
                              "LAYERS" : "wms_ext:arcgis_raster",
                              "TILED" : "True",
                              "TRANSPARENT" : "False",
                              "VERSION" : "1.3.0"
                          }
                      }
                  ]
              },
              {
                  "name" : "Luftbild",
                  "ollayers" : [
                      {
                          "server" : "Geoserver",
                          "attribution" : "<a href=\"http://isk.geobasis-bb.de\">© LGB | www.geobasis-bb.de</a> ",
                          "url" : "http://isk.geobasis-bb.de/mapproxy/dop20/service",
                          "opacity" : 1,
                          "params" : {
                              "LAYERS" : "dop20c",
                              "VERSION" : "1.1.1"
                          }
                      }
                  ]
              },
              {
                  "name" : "Hybrid",
                  "ollayers" : [
                      {
                          "server" : "Geoserver",
                          "attribution" : "<a href=\"http://isk.geobasis-bb.de\">© LGB | www.geobasis-bb.de</a> ",
                          "url" : "http://isk.geobasis-bb.de/mapproxy/dop20/service",
                          "opacity" : 1,
                          "params" : {
                              "LAYERS" : "dop20c",
                              "VERSION" : "1.1.1"
                          }
                      },
                      {
                          "server" : "Geoserver",
                          "attribution" : "<a href=\"http://www.brandenburg-forst.de\">© LFB Forstgrundkarte | www.brandenburg-forst.de</a> ",
                          "url" : "http://www.brandenburg-forst.de:8080/geoserver/wms_ext/wms",
                          "opacity" : 0.6000000000000000,
                          "params" : {
                              "LAYERS" : "wms_ext:arcgis_raster",
                              "TILED" : "True",
                              "TRANSPARENT" : "False",
                              "VERSION" : "1.3.0"
                          }
                      }
                  ]
              }
          ]
      }
    });
    var def = Customers.findOne( {_id:cust });
    console.log("Create default Customer");
  }

  // check if admin is admin of all customers ...
  var admin = Meteor.users.findOne({ isServerAdmin:true })
  if( admin ) {

    Customers.find({}).forEach( function ( customer ) {
      if( admin.customers == null )
        admin.customers = {};

      if( admin.customers[ customer._id ] == null )
        admin.customers[ customer._id ] = { departments : {} }

      for( var did in customer.departments ) {
        console.log( "Check : " , customer.name.long, " Department ",  customer.departments[did].name.long )
        if( admin.customers[ customer._id ].departments[ did ] == null )
          admin.customers[ customer._id ].departments[ did ] = { "type":0 , "roles":["admin"] };
        else
          admin.customers[ customer._id ].departments[ did ].roles.push( "admin" );

        admin.customers[ customer._id ].departments[ did ].roles = _.uniq(admin.customers[ customer._id ].departments[ did ].roles);
      }
    })
    Meteor.users.update( {_id:admin._id} ,{ $set : { "customers": admin.customers } } );
  }

  onVersion( last, 0, 7, function() {
    // convert name to firstname
    Meteor.users.find({}).forEach( function( user ) {
      Meteor.users.update({_id:user._id},{ $set: {"profile.firstname": user.profile.name}});
      Meteor.users.update({_id:user._id},{ $unset: {"profile.name":false} } );
    });
  });

  onVersion( last, 0, 9, function() {
    Stands.find().forEach( function( stand ) {
        stand['location'] = {type:"Point", coordinates: [ stand.position.lng, stand.position.lat ] };
        stand['position'] = null;
        stand.type = parseInt( stand.type );
        Stands.update({_id:stand._id},stand);
    })
  })

  onVersion( last, 0, 10, function() {
    Meteor.users.find({}).forEach( function( user ) {
      Meteor.users.update({_id:user._id},{ $unset: {"profile.currentMode":false,"profile.currentSelectedArea":false,"profile.currentSelectedPlan":false} } );
    })
  })

  onVersion( last, 0, 11, function() {
    Meteor.users.find({}).forEach( function( user ) {
      Meteor.users.update({_id:user._id},{ $unset: {"emails[0]":false}, $set:{"profile.dogs":[]} } );
    })
  })
  onVersion( last, 0, 12, function() {
    /*
      Die Eingeschaft Currentpath ist jetzt ein Array.
    */
    Meteor.users.find({}).forEach( function( user ) {
      if( typeof(user.profile.currentpath) == "string" ) {
        Meteor.users.update({_id:user._id}, { $set: { 'profile.currentpath': user.profile.currentpath.split('|') } });
      }
    })
  })
  onVersion( last, 0, 13, function() {
    /*
      Eine Benutzerrole hat jetzt eine Typ (0,1,2,4)
    */
    Meteor.users.find({}).forEach( function( user ) {
      for( var c in user.customers ) {
        for( var d in user.customers[c].departments ) {
          user.customers[c].departments[d]['type'] = 0;
        }
      }
      Meteor.users.update({_id:user._id}, user );
    })
  })
  onVersion( last, 0, 15, function() {
    /*
      Ein Benutzer kann jetzt mehrere Rollen haben. Aus dem Feld "role" wird der Array "roles"
    */
    Meteor.users.find({}).forEach( function( user ) {
      for( var c in user.customers ) {
        for( var d in user.customers[c].departments ) {
          user.customers[c].departments[d]['roles'] = [ user.customers[c].departments[d].role ];
          delete user.customers[c].departments[d].role;
        }
      }
      Meteor.users.update({_id:user._id}, user );
    })
  })
  onVersion( last, 0, 16, function() {
    // convert name to firstname

    Meteor.users.find({}).forEach( function( user ) {
      if( user.profile.name != null ) {
        Meteor.users.update({_id:user._id},{ $set: {"profile.firstname": user.profile.name}});
        Meteor.users.update({_id:user._id},{ $unset: {"profile.name":false} } );
      }
    });
  });
  onVersion( last, 0, 17, function() {
    Areas.find({}).forEach( function( area ) {
      if( area.desc == null ) {
        area.desc = "";
        Areas.update({_id:area._id},{$set:{desc:""}});
      }
      Areas.update({_id:area._id},{$unset:{shape:true}});
    });
  });
  // Versions.insert({major:0,minor:3,date:new Date(3),changes:[] });
})
