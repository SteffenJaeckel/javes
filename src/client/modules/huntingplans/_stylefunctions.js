

var minzoom = 2;

function flatPoints( data, flat ) {
  if( flat == null) {
    flat = [];
  }
  if( data.length == 2 && typeof( data[0] ) == 'number' && typeof( data[1] ) == 'number' ) {
    flat.push( data );
    return flat;
  } else {
    for( var i=0;i < data.length;i++  ) {
      if( data[i] instanceof Array ) {
        flat = flatPoints( data[i], flat );
      }
    }
  }
  return flat;
}

function getColor( feature , print ) {

  var disabled = feature.get('disabled');

  if( disabled ) {
    img = 'img/disabled/'+(parseInt(feature.get('type'))+3)+'00.png'
    color = [128,128,128, 1 ];
    return {'img':img,'color':color,'opacity':opacity};
  }

	if( print ) {
		img = 'img/disabled/'+(parseInt(feature.get('type'))+3)+'00.png'
    color = [128,128,128, 1 ];
		if( feature.get('color') != null ) {
			var c = parseInt(feature.get('color'));
			img = 'img/marker/'+(parseInt(feature.get('type'))+3)+'0'+c+'.png'
			color = ol.color.asArray( Colors[ c ] );
		}
    return {'img':img,'color':color,'opacity':1.0};
	}

  var selected_route = Session.get('gis-selection');
  var route = feature.get('route');
  var opacity = 1;
  var color = [128,128,128, opacity ];
  var img = '';

  var standselection = Session.get('selected-routestands');

  if( standselection ) {
    if( _.indexOf( standselection , feature.getId() ) != -1 ) {
      route = selected_route;
    } else if ( route ==  selected_route ) {
      route = null;
    }
  }

  if( selected_route && (route != selected_route) && (feature.getId() != '0' ) ) {
    opacity = 0.6;
  }

  if( feature.get("area") != null ) {
    if( feature.get('color') != null ) {
      var c = parseInt(feature.get('color'));
      var alloc = Allocations.findOne( { stand : feature.getId() , from : { $gte: new Date() }} )
      if( alloc )  {
        if( alloc.user.id == Meteor.user()._id ) {
          c = 5;
        } else {
          c = 1;
        }
      }
      img = 'img/marker/'+(parseInt(feature.get('type'))+3)+'0'+c+'.png'
      color = ol.color.asArray( Colors[ c ] );
      color[3] = opacity;
    } else {
      img = 'img/disabled/'+(parseInt(feature.get('type'))+3)+'00.png'
      color = [128,128,128, opacity ];
    }
  } else {
    if( route != null )
      var parent = mapsources['routes'].getFeatureById( route );

    if( parent ) {
      var c = parseInt(parent.get('color'));
      img = 'img/marker/'+(parseInt(feature.get('type'))+3)+'0'+c+'.png'
      color = ol.color.asArray( Colors[ c ] );
      color[3] = opacity;
    } else {
      img = 'img/disabled/'+(parseInt(feature.get('type'))+3)+'00.png'
      color = [128,128,128, opacity ];
    }
  }

  return {'img':img,'color':color,'opacity':opacity};
}

getReportStyle = function( feature, res, selected ) {

  var color = parseInt(feature.get('color'));
  var type = parseInt(feature.get('type'));
  var text = feature.get('text');
  var zindex = parseInt(feature.get('z-index'));

  if( feature.get("disabled") == 1 ) {
    var img = 'img/disabled/'+(type)+'00.png';
  } else {
    var img = 'img/marker/'+(type)+'0'+(color)+'.png';
  }

  var opa =  ( Session.get('gis-selection') && feature.get('route') != Session.get('gis-selection') ) ?  0.3 : 1;
  styles = [];

  styles.push( new ol.style.Style({
    image: new ol.style.Icon(({
      anchor: [0.5, 1],
      scale: ( res <= minzoom ) ? 1 : 0.5 ,
      src: img,
      opacity: opa
    })),
    text: new ol.style.Text({
      text: ( res <= minzoom ) ? text:"",
      scale: ( res <= minzoom ) ? 1.0 : 0.5 ,
      offsetY: -16,
      fill: new ol.style.Fill({
        color: [0, 0, 0, opa]
      }),
      stroke: new ol.style.Stroke({
        color: [0, 0, 0, opa],
        width: 1
      })
    }),
    zIndex: zindex
  }))
  return styles;
}

getDogStandStyle = function( feature, res ) {

  var hunter = feature.get('hunter');
  var styles = [];

  if( editor.get() && editor.get().stands ) {
    if( editor.get().stands[ feature.getId() ] ) {
      hunter = editor.get().stands[ feature.getId() ].user
    }
  }

  if( hunter && hunter != '' ) {

    var item = getColor( feature )
    var u = Meteor.users.findOne({_id:hunter});
    var dc = item.color.concat([]);
    dc[3] = 0.5;

    if( u && u.profile.dogs && u.profile.dogs.length > 0 ) {
      // hunter += " "+"Teckel"+" (kurz)";
      hunter = ( u ) ? u.profile.surname+', '+u.profile.firstname : '';
      for(var i=0;i < 1;i++) {
        styles.push( new ol.style.Style({
          image: new ol.style.Circle({
            radius: (200 + i*100)/res,
            fill: new ol.style.Fill({
              color: dc
            }),
            stroke: new ol.style.Stroke({
              color: [0, 0, 0, item.opacity * 0.5 ],
              width: 1
            }),
            zIndex: parseInt( feature.get('z-index'))*2 -100
          })
        }))
      }

      styles.push( new ol.style.Style( {
          text: new ol.style.Text( {
            scale: (res < minzoom ) ? 2:1 /* + Math.round(Math.random()*3)*0.5*/,
            text: "",/*"(((Terrier)))"*/
            offsetY: (res < minzoom ) ? 30:5,
            fill: new ol.style.Fill({
              color: item.color
            }),
            stroke: new ol.style.Stroke({
              color: [0, 0, 0, 0.8 ],
              width: (res < minzoom ) ? 2:4
            }),
          }),
          zIndex: parseInt( feature.get('z-index'))*2-50
      }))
    }
  }
  return styles;
}

getStandStyle = function( feature , res, selected, print  ) {

  var item = getColor( feature , print )

  var styles = [];

  var hunter = feature.get('hunter');

  if( editor.get() && editor.get().stands ) {
    if( editor.get().stands[ feature.getId() ] ) {
      hunter = editor.get().stands[ feature.getId() ].user
    }
  }

  if( res < minzoom ) {
    styles.push( new ol.style.Style({
        image: new ol.style.Icon(({
          anchor: [0.5, 1],
          scale: ( res <= minzoom ) ? 1 : 0.25 ,
          src: item.img,
          opacity: item.opacity
        })),
        text: new ol.style.Text({
          text: feature.get('name'),
          scale: ( res <= minzoom ) ? 1.2 : 0.7 ,
          offsetY: -22,
          fill: new ol.style.Fill({
            color: [0, 0, 0, 1]
          }),
          stroke: new ol.style.Stroke({
            color: [0, 0, 0, 1],
            width: 1
          }),
        }),
        zIndex: parseInt( feature.get('z-index'))*2
    }))

    if( hunter && hunter != '' ) {
      var u = Meteor.users.findOne({_id:hunter});
      hunter = ( u ) ? u.profile.surname+', '+u.profile.firstname : '';

      styles.push( new ol.style.Style( {
          text: new ol.style.Text( {
            font:'tahoma',
            scale:1.4,
            text: hunter,
            offsetY: 10,
            fill: new ol.style.Fill({
              color: item.color
            }),
            stroke: new ol.style.Stroke({
              color: [0, 0, 0, item.opacity * 0.8 ],
              width: 4
            }),
          }),
          zIndex: parseInt( feature.get('z-index'))*2
      }))
    }

    if( selected ) {
      styles.push( new ol.style.Style({
          image: new ol.style.Icon({
            anchor: [0.5,0.7],
            src:'img/marker_selection.png'
          }),
          zIndex: parseInt( feature.get('z-index'))*2-1
      }))
    }
  } else if ( res < 12 ) {
    styles.push( new ol.style.Style({
        image: new ol.style.Icon({
          anchor: [0.5, 1],
          scale: 0.5 ,
          src: item.img,
          opacity: item.opacity
        }),
        text: new ol.style.Text({
          text: feature.get('name'),
          scale: 0.7 ,
          offsetY: -11,
          fill: new ol.style.Fill({
            color: [0, 0, 0, item.opacity]
          }),
          stroke: new ol.style.Stroke({
            color: [0, 0, 0, item.opacity],
            width: 1
          }),
        }),
        zIndex: parseInt( feature.get('z-index'))*2
      })
    )

    if( hunter && hunter != '' ) {
      var u = Meteor.users.findOne({_id:hunter});
      if( u ) {
        styles.push( new ol.style.Style( {
            text: new ol.style.Text( {
              font:'tahoma',
              scale:1.0,
              text: '-:-',
              offsetX: 0,
              offsetY: 0,
              fill: new ol.style.Fill({
                color: item.color
              }),
              stroke: new ol.style.Stroke({
                color: [0, 0, 0, item.opacity * 0.8 ],
                width: 4
              }),
            }),
            zIndex: parseInt( feature.get('z-index'))*2
        }))
      }
    }

    if( selected ) {
      styles.push( new ol.style.Style({
          image: new ol.style.Icon({
            anchor: [0.5,0.7],
            src:'img/marker_selection.png',
            scale: 0.5
          }),
          zIndex: parseInt( feature.get('z-index'))*2-1
      }))
    }
  }
  return styles;
}

getHuntingAreaStyle = function( feature , res, selected, print ) {

  var route = Session.get('gis-selection');
  var color;
  var z = 100;

  if( feature.get('color') != null ) {
    color = ol.color.asArray( Colors[ feature.get('color') ] );
  } else if( editor.get() && editor.get().color ) {
    color = ol.color.asArray( Colors[ editor.get().color ] );
  } else {
    color = selected ? [0,200,200,1] : [255,180,0,1];//'#33ccff';
  }

  if( feature.get('width') != null ) {
    width = feature.get('width');
  } else if( editor.get() && editor.get().width ) {
    width = editor.get().width;
  } else {
    width = Math.max( 4-res, 1 );
  }

  if( route && route != feature.getId() && feature.getGeometry().getType() != 'Polygon' && print == null ) {
    color[3] = 0.3;
  } else {
    color[3] = 1;
    width += 2;
    z += 100;
  }

  var styles = [];
  if( selected ) {
    styles.push( new ol.style.Style({
      image: new ol.style.Circle({
        radius: 12,
        stroke: new ol.style.Stroke({
          color: color,
          width: 2
        })
      }),
      stroke: new ol.style.Stroke({
        color: color,
        width: width
      }),
      fill: new ol.style.Fill( {
        color:[255,255,255,0.4]
      }),
      zIndex: z
    }))
    if( res < 4 ) {
      styles.push( new ol.style.Style({
          image: new ol.style.Circle({
            radius: width+2,
            fill: new ol.style.Fill({
              color: color
            })
          }),
          geometry: function(feature) {
            var pnts = flatPoints( feature.getGeometry().getCoordinates() );
            return new ol.geom.MultiPoint(pnts);
          },
          zIndex: z
      }))
    }
    return styles;
  } else {
    styles = [
      new ol.style.Style({
          stroke: new ol.style.Stroke({
            color: [0,0,0,color[3]],
            width: width+4
          }),
          zIndex: z
      }),
      new ol.style.Style({
          stroke: new ol.style.Stroke({
            color: color,
            width: width
          }),
          zIndex: z+1
      })
    ];
    var radius = 10;
    if( feature.get('group') && feature.get('group') != '' ) {
      styles.push( new ol.style.Style({
          image: new ol.style.Circle({
            radius: radius,
            fill: new ol.style.Fill({
              color: [color[0],color[1],color[2],1]
            })
          }),
          text: new ol.style.Text({
            text: feature.get('group'),
            scale: 1.2 ,
            offsetY: 0,
            fill: new ol.style.Fill({
              color: [0, 0, 0, 1]
            }),
            stroke: new ol.style.Stroke({
              color: [0, 0, 0, 0.7],
              width: 1
            }),
            zIndex: z+1
          }),
          geometry: function(feature) {
            var pnt = feature.getGeometry().getLastCoordinate();
            return new ol.geom.Point(pnt);
          },
          zIndex: z+1
      }))
      styles.push( new ol.style.Style({
          image: new ol.style.Circle({
            radius: radius+2,
            fill: new ol.style.Fill({
              color: [0,0,0,color[3]]
            })
          }),
          geometry: function(feature) {
            var pnt = feature.getGeometry().getLastCoordinate();
            return new ol.geom.Point(pnt);
          },
          zIndex: z
      }))
    }
    return styles;
  }
}

getHuntingAreaSelectionStyle = function( feature , res ) {
  return getHuntingAreaStyle( feature, res, true );
}
