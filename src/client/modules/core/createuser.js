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
  dogs : function() {
    return modals.get().dogs;//[ {name:"Waldi",race:"Teckel",desc:"Schweishund"}, {name:"Aron",race:"Deutsch Kurzhaar",desc:"Stöberhund - (Weit)"} ];
  },
  dogtype : function( i ) {
    return dogtypes[ parseInt(i) ];
  },
  dogtypes : function() {
    return dogtypes;
  },
  roles: function () {
    console.log(app.getRole());
    return app.getRole().inviteroles;
  }
});

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

    var data = {
      email: $('#email').val(),
      firstname: $('#firstname').val(),
      surname: $('#surname').val(),
      role:$('#role').val(),
      groups:$('#groups').val(),
      dogs: modals.get().dogs
    };
    clearError();
    Meteor.call("findCreateUser", data, function (e,id) {
        if( e != null ) {
					applyError(e);
        } else {
          modals.pop();
        }
    })
  },
  'click #save': function() {
    var data = {
      email: $('#email').val(),
      firstname: $('#firstname').val(),
      surname: $('#surname').val(),
      role:$('#role').val(),
      groups:$('#groups').val(),
      dogs: modals.get().dogs
    };
    clearError();
    Meteor.call("findCreateUser", data, function (e,id) {
        if( e != null ) {
          applyError(e);
        } else {
          // TODO: clear all fields
					$('input').val('');
          modals.set("dogs",[])
          $('#role').focus();
        }
    })
    //modals.pop();
  }
})
