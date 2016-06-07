Template.userlistitem.helpers({
  checkstate : function( a, b ) {
    return ( a == b );
  },
  hastrackingdog : function ( e ) {
    for( var i=0;i < e.length;i++ ) {
      if( e[i].type == 0)
      return true;
    }
    return false;
  }
})

Template.dogtype.helpers({
  hastrackingdog : function ( e , t ) {
    for( var i=0;i < e.length;i++ ) {
      if( e[i].type === t )
      return true;
    }
    return false;
  }
})
