Template.customerbody.helpers({

})

Template.customerbody.events({

})

Template.newcustomer.events({
  'click .close.modal-close': function (e) {
    modals.pop();
  },
  'click #save': function( e ) {
    var btn = $(e.currentTarget);
    btn.button('loading');
    Meteor.call('addhunter', modals.get(), function ( e ) {
      if( e ) {
        console.log( modals.get() )
        console.log( e )
      } else {
        modals.pop();
      }
      setTimeout( function() {
        btn.button('reset');
      }, 3000 )
    })
  },
  'click #abort': function( e ) {
    modals.pop();
  }
})

Template.editcustomer.helpers({
  confirmdelete : function () {
    return Session.get('confirm-delete');
  }
})

Template.editcustomer.events({
  'click .close.modal-close': function (e) {
    modals.pop();
  },
  'click #delete': function( e ) {
    Session.set('confirm-delete',true);
  },
  'click #confirm': function( e ) {
    var btn = $(e.currentTarget);
    btn.button('loading');
    Meteor.call('deleteHunter', modals.get()._id ,function( e ) {
      if( e ) {
        console.log( e );
      } else {
        modals.pop();
      }
      setTimeout( function() {
        btn.button('reset');
      }, 1000 )
      Session.set('confirm-delete',null);
    })
  },
  'click #save': function( e ) {
    var btn = $(e.currentTarget);
    btn.button('loading');
    Meteor.call('updateHunter', modals.get()._id, modals.get().email ,modals.get(), function ( e ) {
      if( e ) {
        console.log( modals.get() )
        console.log( e )
      } else {
        modals.pop();
      }
      setTimeout( function() {
        btn.button('reset');
      }, 1000 )
    })
  },
  'click #abort': function( e ) {
    if( Session.get('confirm-delete') ) {
      Session.set('confirm-delete',null);
    } else {
      modals.pop();
    }
  }
})
