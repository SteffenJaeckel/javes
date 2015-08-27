Template.hunterbody.helpers({
  data : function() {
    return modals.get();
  },
  huntertypes : function() {
    var data=[];
    for( var i=0;i < Huntertypes.length;i++){
      data.push({ type:i, name:Huntertypes[i], class: 'huntertype-'+(i+1), selected : (modals.get().type == i ) ? 'hover':'' })
    }
    return data;
  },
  aviablegroups : function () {
    var groups={};
    Meteor.users.find({'profile.group':{ $not:''} }).map( function( item, i, doc ) {
      if( item.profile.group != null ) {
        for( var g=0;g < item.profile.group.length;g++ ) {
          this[ item.profile.group[g] ] = 1
        }
      }
    }, groups );
    return _.keys(groups);
  }
})

Template.hunterbody.events({
  'click .remove-group': function ( e ) {
    var group = modals.get().group;
    var i = _.indexOf( group , $(e.currentTarget).attr('data'));
    if( i >= 0 ) {
      group.splice(i,1);
      modals.set('group',group);
    }
  },
  'click .huntertype' : function( e ) {
    modals.set('type', parseInt( $(e.currentTarget).attr('data')) );
  },
  'click .gender' : function ( e ) {
    modals.set('gender', parseInt( $(e.currentTarget).attr('data')) );
  },
  'keyup .text' : function( e ) {
    var key = $(e.currentTarget).attr('data');
    var val = $(e.currentTarget).val();
    modals.set( key , val );
  },
  'click .groupselect' : function( e ) {
    var val = $(e.currentTarget).text();
    modals.set( 'group' , val );
  },
  'click .checkboxlink' : function( e ) {
    var key = $(e.currentTarget).attr('data');
    var val = modals.get();
    if( val[key] == true) {
      modals.set( key , false );
    } else {
      modals.set( key , true );
    }
  },
  'click #add-dog' : function ( e ) {
    modals.push( 'newdog' , {type:0,radius:0,race:'',name:'',examinations:''} );
  }
})

Template.newhunter.events({
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

Template.edithunter.helpers({
  confirmdelete : function () {
    return Session.get('confirm-delete');
  },
  isnotmanaged: function () {
    return (modals.get().managed == true);
  }
})
Template.edithunter.events({
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
