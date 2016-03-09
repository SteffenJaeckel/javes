function onAceLoaded() {
  var editor = AceEditor.instance("editor");
  if(editor.loaded !== undefined) {
    var customer = Customers.findOne( {_id: app.getCustomer() })
    editor.setValue( JSON.stringify( customer.mapconfig, null, '\t' ) );
  } else {
    setTimeout( onAceLoaded , 100 );
  }
}

Template.settings.helpers( {
  customer: function() {
    return Customers.findOne( {_id: app.getCustomer() });
  }
})

Template.settings.rendered = function() {
  console.log("render settings");
  var editor = AceEditor.instance("editor",{
      theme:"textmate",
      mode:"json"
  });
  setTimeout( onAceLoaded , 100 );
}

Template.settings.events( {
  'click #revert': function() {
    var editor = AceEditor.instance("editor");
    if(editor.loaded !== undefined) {
      editor.setValue( JSON.stringify( mapconfig, null, '\t' ) );
    }
  },
  'click #save': function() {
    var editor = AceEditor.instance("editor");
    if(editor.loaded !== undefined) {
      try {
        var newconfig =  JSON.parse( editor.getValue() );
        Meteor.call("saveMapconfig", app.getCustomer(), newconfig , function ( e ) {
          if( e )
            console.log( e );
        });
      }
      catch( e )
      {
        alert( e );
      }
    }
  }
})
