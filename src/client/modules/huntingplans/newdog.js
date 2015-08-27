Template.newdog.helpers({
  selectedTypeClass : function( type ) {
    return (modals.get().type == parseInt(type) ) ? 'selected': '';
  },
  selectedDogRange : function ( cl ) {
    return (modals.get().range == parseInt(cl) ) ? 'hover': '';
  }
})

Template.newdog.events({
  'click .close.modal-close': function (e) {
    modals.pop();
  },
  'click #save': function( e ) {
    var dog = modals.get();
    modals.pop();
    var hunter = modals.get();
    hunter.dogs.push( dog );
    modals.set('dogs',hunter.dogs);
  },
  'click #abort': function( e ) {
    modals.pop();
  },
  'click .dogtype' : function( e ) {
    modals.set('type', parseInt( $(e.currentTarget).attr('data')) );
  },
  'click .dogrange' : function( e ) {
    modals.set('range', parseInt( $(e.currentTarget).attr('data')) );
  },
  'keyup .text' : function( e ) {
    var key = $(e.currentTarget).attr('data');
    var val = $(e.currentTarget).val();
    modals.set( key , val );
  },
  'keyup .text-number' : function( e ) {
    var key = $(e.currentTarget).attr('data');
    var val = parseInt( $(e.currentTarget).val() );
    modals.set( key , val );
  },
  'click .checkboxlink' : function( e ) {
    console.log(e);
    var key = $(e.currentTarget).attr('data');
    var val = modals.get();
    console.log( val.newdog[key] )
    if( val.newdog[key] == true) {
      modals.set( key , false );
    } else {
      modals.set( key , true );
    }
  },
  'click #add-dog' : function ( e ) {
    modals.pop( 'newdog' , {} );
  }
})
