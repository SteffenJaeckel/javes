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

  onVersion( last, 0, 7, function() {
    // convert name to firstname
    Meteor.users.find({}).forEach( function( user ) {
      Meteor.users.update({_id:user._id},{ $set: {"profile.firstname": user.profile.name}});
      Meteor.users.update({_id:user._id},{ $unset: {"profile.name":false} } );
    });
  });

  onVersion( last, 0, 8, function() {
    // convert name to firstname
    var def = Customer.findOne();

    if( def == null ) {
      var dep = Random.id();
      var departments = {};
      departments[ dep ] = {
        name: {
          short:"06",
          long:"Hangelsberg"
        }
      };

      var cust = Customer.insert({
        name: {
          short:'LFB',
          long:'Landesbetrieb Forst Brandenburg'
        },
        departments : departments
      });
    } else {
      var cust = def._id;
      var dep  = _.keys(def.departments)[0];
    }
    console.log("Create default Customer");
  });

  onVersion( last, 0, 10, function() {
    Meteor.users.find({}).forEach( function( user ) {
      Meteor.users.update({_id:user._id},{ $unset: {"profile.currentMode":false,"profile.currentSelectedArea":false,"profile.currentSelectedPlan":false} } );
    })
  })

  onVersion( last, 0, 11, function() {
    Meteor.users.find({}).forEach( function( user ) {
      Meteor.users.update({_id:user._id},{ $unset: {"emails[0]":false}, $set:{dogs:[]} } );
    })
  })
  // Versions.insert({major:0,minor:3,date:new Date(3),changes:[] });
})
