Template.adduser.created = function() {
  Session.set('error',null)
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
    Session.set('error',null);
    Meteor.call("findCreateUser", data, function (e,id) {
        if( e != null ) {
          console.log(e);
          Session.set('error',e.reason.text);
          $('#'+e.reason.id).focus();
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
    Session.set('error',null);
    Meteor.call("findCreateUser", data, function (e,id) {
        if( e != null ) {
          console.log(e);
          Session.set('error',e.reason.text);
          $('#'+e.reason.id).focus();
        } else {
          // TODO: clear all fields
          $('#role').focus();
        }
    })
    //modals.pop();
  }
})
