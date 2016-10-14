Template.adduser.created = function() {
  Session.set('error',null)
  var data = modals.get();
  if( ! _.isArray(data.dogs ) ) {
    modals.set('dogs',[]);
  }
}

Template.adduser.rendered = function() {
	$('#role').focus();
}

function clearError() {
	Session.set('error',null)
	$('.has-error').removeClass('has-error');
}

function applyError( e ) {
	Session.set('error',e.reason.text);
	$('#'+e.reason.id).parent().addClass('has-error');
	$('#'+e.reason.id).focus();
}


var dogtypes = ["Stöberhund - Kurz", "Stöberhund - Mittel","Stöberhund - Weit", "Schweisshund"];

Template.adduser.helpers({
  error : function () {
    return Session.get('error')
  },
  title: function() {
    if( modals.get().title ) {
      return modals.get().title;
    }
    else {
      return "Neuen Benutzer anlegen";
    }
  },
  userid: function( ) {
    return modals.get()._id;
  },
  dogs : function() {
    return modals.get().dogs;
  },
  dogtype : function( i ) {
    return dogtypes[ parseInt(i) ];
  },
  dogtypes : function() {
    return dogtypes;
  },
  isRole : function( type ) {
    return modals.get().role == type;
  },
  email : function() {
    return modals.get().email;
  },
  managed : function() {
    return modals.get().managed;
  },
  firstname : function() {
    return modals.get().firstname;
  },
  surname : function() {
    return modals.get().surname;
  },
  phone1 : function() {
    return modals.get().phone1;
  },
  phone2 : function() {
    return modals.get().phone2;
  },
  gender : function() {
    return modals.get().gender;
  },
  street : function() {
    return modals.get().street;
  },
  zip : function() {
    return modals.get().zip;
  },
  city : function() {
    return modals.get().city;
  },
  number : function() {
    return modals.get().number;
  },
  groups : function() {
    var list = "";
    var groups = modals.get().groups;
    for( var g in groups ) {
      if( list != "")
        list += ", ";
      list += groups[g];
    }
    return list;
  },
  roles: function () {
    return app.getRole().inviteroles;
  }
});

function getdata ( ) {
  var data = {
    _id : modals.get()._id,
    managed: $('input[name="profiletype"]:checked').val(),
    email: $('#email').val(),
    firstname: $('#firstname').val(),
    surname: $('#surname').val(),
    street: $('#street').val(),
    number: $('#number').val(),
    city: $('#city').val(),
    phone1: $('#phone1').val(),
    phone2: $('#phone2').val(),
    zip: $('#zip').val(),
    role:$('#role').val(),
    groups:$('#groups').val(),
    dogs: modals.get().dogs
  };

  clearError();

  console.log( data );

  return data;
}

Template.adduser.events({
  'click .add-dog' : function() {
    var data = modals.get();
    data.dogs.push( {name:$('#dog-name').val(), race:$('#dog-race').val(), type: parseInt( $('#dog-type').val() ) } );
    modals.set("dogs", data.dogs );
  },
  'click .delete-dog' : function( e ) {
    var index = parseInt($(e.currentTarget).attr('data'));
    var data = modals.get();
    data.dogs.splice(index,1);
    modals.set("dogs", data.dogs );
  },
  'click .close': function() {
    modals.pop();
  },
  'click #abort': function() {
    modals.pop();
  },
  'click #save-exit' : function() {
    if( modals.get()._id != null ) {
      Meteor.call("updateUser", getdata(), function (e,id) {
          if( e != null ) {
            applyError(e);
          } else {
            modals.pop();
          }
      })
    } else {
        Meteor.call("findCreateUser", getdata(), function (e,id) {
          if( e != null ) {
            applyError(e);
          } else {
            modals.pop();
          }
      })
    }
  },
  'click #save': function() {
    Meteor.call("findCreateUser", getdata(), function (e,id) {
      if( e != null ) {
        applyError(e);
      } else {
        $('input').val("");
      }
    })
  },
  'click #delete': function() {
      if( confirm("Soll der Bentuzer wirklich gelöscht werden ?") ) {
        Meteor.call("deleteUser", modals.get()._id, function (e,id) {
          if( e != null ) {
            applyError(e);
          } else {
            modals.pop();
          }
        })
      }
  }
})
