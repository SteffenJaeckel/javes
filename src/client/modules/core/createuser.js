Template.adduser.created = function() {
  Session.set('error',null)
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
  roles: function () {
    console.log(app.getRole());
    return app.getRole().inviteroles;
  }
});

Template.adduser.events({
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
      groups:$('#groups').val()
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
      groups:$('#groups').val()
    };
    clearError();
    Meteor.call("findCreateUser", data, function (e,id) {
        if( e != null ) {
          applyError(e);
        } else {
          // TODO: clear all fields
					$('input').val('');
          $('#role').focus();
        }
    })
    //modals.pop();
  }
})
