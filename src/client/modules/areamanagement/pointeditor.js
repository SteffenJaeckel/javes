var workinglayer = null;
var overlaylayer;
var stands = [];

function getEditPointTool() {
  var drawpath = new ol.interaction.Modify( { style:getHuntingAreaSelectionStyle ,pixelTolerance: 32,type:'Point', features: overlaylayer.getSource().getFeaturesCollection() });
  drawpath.on('drawend', function ( e ) {
  })
  drawpath.set('cursor','draw-cursor');
  drawpath.set('keydown', function( e ) {
  });
  return drawpath;
}

var undo;

function updateEditor() {
  console.log( editor.get() )
  app.pushTool( getEditPointTool() )
}

Template.pointeditor.rendered = function () {

}

Template.pointeditor.created = function () {
  var map = app.getMap();
  overlaylayer =  new ol.layer.Vector({
    source: new ol.source.Vector({
      features: new ol.Collection(),
      useSpatialIndex: false
    }),
    style: function ( f,r ) {
        return getStandStyle( f,r,false );
    },
    updateWhileAnimating: true, // optional, for instant visual feedback
    updateWhileInteracting: true // optional, for instant visual feedback
  });

  var stand = new ol.Feature();
  stand.setGeometry( new ol.geom.Point( map.getView().getCenter() ) );
  stand.setId("asdasdasd");
  stand.set('type',2)
  stand.set('name',"test")
  stand.set('color',0);
  stand.set('z-index', 1 )

  overlaylayer.getSource().addFeature( stand );

  //overlaylayer.getSource().addFeature( new ol.Feature() );
  app.addLayer( overlaylayer );
  updateEditor();
  //overlaylayer.getSource().getFeaturesCollection().clear();
}

Template.pointeditor.destroyed = function () {
  console.log("route editor destroyed");
  app.popTool()
  app.removeLayer( overlaylayer );
  overlaylayer.getSource().getFeaturesCollection().clear();
}

Template.pointeditor.helpers({
})


Template.pointeditor.events({

  'click #save' : function ( e ) {
    Session.set( "error",null);
    editor.pop();
  },
  'click #abort' : function ( e ) {
    if( undo ) {
      mapsources['routes'].addFeature( undo );
      undo = null;
    }
    Session.set('selected-routestands',null)
    mapsources['stands'].changed();
    editor.pop();
  }
})
