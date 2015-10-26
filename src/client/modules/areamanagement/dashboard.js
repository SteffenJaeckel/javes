Template.dashboard.helpers({
  areas: function () {
    return Areas.find();
  }
})

Template.dashboard.events({
  'dblclick .area' : function( e ) {
    console.log( $(e.currentTarget).attr('data'));
    app.setModulePath( ['areamanagement', $(e.currentTarget).attr('data') ] )
  }
})
