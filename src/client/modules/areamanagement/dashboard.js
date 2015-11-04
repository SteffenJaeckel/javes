Template.dashboard.helpers({
  areas: function () {
    return Areas.find({},{ sort : { 'name':1 } });
  }
})

Template.dashboard.events({
  'dblclick .area' : function( e ) {
    console.log( $(e.currentTarget).attr('data'));
    app.setModulePath( ['areamanagement', $(e.currentTarget).attr('data') ] )
  },
  'click #new-area': function( e ) {
    modals.push('newarea');
  }
})
