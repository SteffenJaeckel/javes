
function getItemFromPath( path ) {
  var items = path.split('/');
  var modal = modals.get();
  var data = modal.data;
  for( var i=0;i < items.length;i++ ) {
    for( var o =0; o < data.length;o++ ) {
      if( data[o] == null ) {
        console.log("no item found at ",o," in ", data )
      }
      if( data[o].id == items[i] ) {
        if( i == items.length-1 ) {
          return data[o];
        } else {
          data = data[o].items;
        }
      }
    }
  }
}

function setItemAtPath( path , item ) {
  var items = path.split('/');
  var modal = modals.get();
  var data = modal.data;
  for( var i=0;i < items.length;i++ ) {
    for( var o =0; o < data.length;o++ ) {
      if( data[o].id == items[i] ) {
        if( i == items.length-1 ) {
          data[o] = item;
        } else {
          data = data[o].items;
        }
      }
    }
  }
  modals.set( "data",modal.data );
}

function buildItemFromType( type, item, data, path ) {
  switch( type.type ) {
    case 'object':
      var sub = buildItemFromModel( type.model, data, path+"/"+item );
      return { type:'basemodal_folder', model:type, id:item, path:path+"/"+item, name: type.name, open:true, items: sub };
    break;

    case 'string':
      return { type:'basemodal_item_string', model:type, id:item, path:path+"/"+item, name: type.name, value: (data) ? data:"" };
    break;

    case 'text':
      return { type:'basemodal_item_text', model:type, id:item, path:path+"/"+item, name: type.name, open:true, value: (data) ? data:"" };
    break;

    case 'number':
      return { type:'basemodal_item_number', model:type, id:item, path:path+"/"+item, name: type.name, value: (data) ? data:"" };
    break;

    case 'set' :
      var options = [];
      for( var i=0;i < type.items.length;i++ ) {
        options.push({k:i,v:type.items[i]});
      }
      return { type:'basemodal_item_set', model:type, id:"date", path:"head/date", name: type.name, value:(data) ? data:"", items: options};
    break;

    case 'array':
      //var sub = buildItemFromModel(type.model, (data) ? data[item]:null, path+"/"+item );
      return { type:'basemodal_array', model:type, id:item, path:path+"/"+item, name: type.name, proto: type.items.name, open:false, items: [] };
    break;

    case 'table':
      //var sub = buildItemFromModel(type.model, (data) ? data[item]:null, path+"/"+item );
      return { type:'basemodal_table', model:type, id:item, path:path+"/"+item, name: type.name, open:true, items: [] };
    break;
  }
  console.log("unkown type ", type );
}

function buildItemFromModel( model, data, path ) {
  var items = [];

  for( var item in model ) {
    items.push( buildItemFromType( model[item], item, (data) ? data[item]:null, path ) )
  }
  return items;
}

newBaseModal = function( model , title, data ) {
  MapConfigmodel = {
	  projection: {type:'object',name:'Projektion' ,model: {
	    name:{type:'string',name:'Name', min:4,max:20},
	    code:{type:'string',name:'Code (proj4js)', min:1,max:512}
	  }},
    group : {type:'array', name:'Gruppen', max: 16, items: {
	    type: 'string', name:'Gruppe', min:1, max: 256
	  }},
	  layer: {type:'array',name:'Layer', max:12, items: {
	    type:'object', name:'Layer Configuration' ,model: {
	      name: { type:'string', name:"Name", min:1, max:256},
	      ollayers : {type:'array', name:"Openlayer 3 Elemente", max: 6, items: {
      		type:'object', name:'ol3 WMS Layer',model:{
      		  server: {type:'set', name:"WMS Server Typ", items: ['Geoserver','Mapserver'] },
      		  attribution: {type:'string',name:'Attributierung'},
      		  url: {type:'string', name:'Url des WMS Dienstes', min:1, max:1024},
      		  opacity: {type:'number',name:'Transparenz',min:0.0, max:1.0},
      		  params: { type:'object', name:'WMS Parameter', model: {
      		    LAYERS: {type:'string',name:'Ebene'},
      		    TILED: {type:'set',items:['True','False'],name:'Kacheln',optional:true},
      		    TRANSPARENT: {type:'set',items:['True','False'],name:'Transparenz',optional:true},
      		    VERSION: {type:'set',items:['1.1.1','1.3.0'],name:'Version',optional:true},
      		  }}
      		}
	      }}
	    }
	  }}
	};

  InnerPage = {
    leftpage: { type:'object', name:"Linke Seite", model: {
  	  timetable: {
        type:'object',name:'Zeitplan' ,model: {
    	    name:{type:'string',name:'Überschrift', min:4,max:80},
          desc:{type:'text',name:'Absatz', min:0,max:2000, optional:true},
          topic: {type:'table',name:'Tagesordungspunkte', max:12, items: {
            	type:'object', name:'Tagesordungspunkt',model:{
                time:{type:'string',name:'Uhrzeit', min:1,max:64},
                topic:{type:'string',name:'Beschreibung', min:1,max:512}
              }
          }}
    	  }
      },
      approval: {
        type:'object',name:'Freigabe' ,model: {
    	    name:{type:'string',name:'Überschrift', min:4,max:80},
          desc:{type:'string',name:'Absatz', min:0,max:2000, optional:true},
          gametypes: {type:'array',name:'Freigaben', max:12, items: {
            	type:'object', name:'Freigabe',model:{
                gametype:{type:'string',name:'Wildart', min:1,max:80},
                ageclasses:{type:'string',name:'Altersklassen / Bemerkungen', min:1,max:512}
              }
          }}
    	  }
      },
      notifocations: {
        type:'object',name:'Hinweise' ,model: {
    	    name:{type:'string',name:'Überschrift', min:4,max:80},
          desc:{type:'string',name:'Absatz', min:0,max:2000, optional:true}
    	  }
      }
    }},
    rightpage: { type:'object', name:'Rechte Seite' ,model: {
        securityadvise : { type:'object', name:'Sicherheitsbelehrung' ,model: {
          name:{type:'string',name:'Überschrift', min:4,max:80},
          gametypes: {type:'array',name:'Punkte', max:12, items: {
            type:'object', name:'Absatz',model:{
              gametype:{type:'string',name:'Überschrift', min:1,max:80},
              ageclasses:{type:'string',name:'Text', min:1,max:512}
            }
          }}
        }}
    }}
  };

  var data = buildItemFromModel( InnerPage, null, "root" );
  modals.push('basemodal', { name:"model", data: data  } )
}

Template.basemodal.helpers( {
  controls : function () {
    var ctrls = [];
    /*Dogmodel = {
  	  name:{name:'Name',type:'string',min:1, max:128},
  	  type: { type:'set' , name:'Typ', items: [0,1] },
  	  race:{name:'Rasse',type:'string',min:1, max:128},
  	  examination:{name:'Prüfungen',type:'string',min:1, max:128, optional: true},
  	  range: { type:'set' , name:'Stöberhundtyp', items: [0, 1, 2], optional: function ( i ) { return (i.type == 0) } },
  	};
    var keys = _.keys( Dogmodel);
    for( var i=0;i < keys.length;i++ ) {

    }*/
    return modals.get().data;
  },
  controlType : function( base , parent ) {
    return parent+"_"+base;
  }
})

Template.basemodal.created = function() {
}

Template.basemodal.deleted = function() {
}

Template.basemodal.events( {
  'click .close': function(e) {
    modals.pop();
  },
  'click #abort': function(e) {
    modals.pop();
  },
  'click .array-plus': function(e) {
    var path = $(e.currentTarget).attr('data');
    var item = getItemFromPath( path );
    var name = Random.id().substr(0,6);
    item.items.push( buildItemFromType( item.model.items, name ,null, item.path ));
    setItemAtPath( path , item );
  },
  'click .array-minus': function(e) {
    var path = $(e.currentTarget).attr('data');
    var p = path.lastIndexOf("/");
    var key = path.substr(p+1, path.length);
    var path = path.substr(0,p);
    var item = getItemFromPath( path );
    for( var i=0;i < item.items.length;i++ ) {
      if( item.items[i].id == key ) {
        item.items.splice(i,1);
      }
    }
    setItemAtPath( path , item );
  },
  'blur .string' : function ( e ) {
    var path = $(e.currentTarget).attr('data');
    var item = getItemFromPath( path );
    item.value = $(e.currentTarget).val();
    setItemAtPath( path , item );
  },
  'click .folder-head' : function (e) {
    var path = $(e.currentTarget).attr('data');
    var item = getItemFromPath( path );
    console.log( item );
    item['open'] = (item['open'])? false:true;
    setItemAtPath( path , item );
  }
})
