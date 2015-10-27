Template.adduser.helpers({
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
  'click #continue': function() {

    var data = {
      email: $('#email').val(),
      firstname: $('#firstname').val(),
      surname: $('#surname').val(),
      role:$('#role').val(),
      groups:$('#groups').val()
    };

    Meteor.call("findCreateUser", data, function (e,id) {
        if( e != null ) {
          console.log(e);
        } else {
          console.log("user found ",id);
        }
    })
    //modals.pop();
  }
})
