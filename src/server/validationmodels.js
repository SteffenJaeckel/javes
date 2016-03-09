DataModels = {

	MapConfigmodel : {
	  projection: {type:'object',name:'Projektion' ,model: {
	    name:{type:'string',name:'Name', min:4,max:20},
	    code:{type:'string',name:'Code (proj4js)', min:1,max:512}
	  }},
	  layer: {type:'array',name:'Layer', max:12, items: {
	    type:'object', name:'Layer Configuration' ,model: {
	      name: { type:'string', name:"Name", min:1, max:256},
	      ollayers : {type:'array', name:"Openlayer 3 Elemente", max: 6, items: {
      		type:'object', name:'ol3 WMS Layer',model:{
      		  server: {type:'set', name:"WMS Server Typ", items: ['Geoserver','Mapserver'] },
      		  attribution: {type:'string',name:'Attributierung'},
      		  url: {type:'string', name:'Url des WMS Dienstes', min:1, max:1024},
      		  opacity: {type:'number',min:0.0, max:1.0},
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
	},

	Customermodel : {
	  name:{type:'string',min:1,max:512},
	  enabled: {type:'bool',name:'Aktiv'},
	  mapconfig: {type:'object', name:'Karten Konfiguration', model : 'MapConfigmodel' }
	},

	Pointmodel : {
	  type: { type:'set' , items: ['Point'] },
	  coordinates : {
      type:'array',name: 'Coordinaten', min:2, max: 2, items: {
	        type: 'number', name:'Wert'
      }
	  }
	},

	Pathmodel : {
	  type: { type:'set' , items: ['LineString'] },
	  coordinates : {
	    type: 'array', name:'Punkte',  items: {
	      type:'array',name: 'Coordinaten', min:2, max: 2, items: {
		        type: 'number', name:'Wert'
	      }
	    }
	  }
	},

	Routemodel : {
	  group: {type:'string', name: 'Gruppe', min:1, max:2},
	  leader: {type:'string', name: 'Ansteller', optional:true},
	  vehicle: {type:'string', name: 'Fahrzeug', optional:true }, // <- hier könnte noch der fuhrpark eingepflegt werden
	  color: { type:'number', name: 'Routenfarbe', min:0 , max: 10 },
	  path: { type:'object',name:'Anstellroute', model: 'Pathmodel' }
	},

	Shapemodel : {
	  type: { type:'set' , items: ['MultiPolygon'] },
	  coordinates : {
	    type:'array', name:'Polygone', max: 256, items: {
	      type:'array', name:'Loops', max: 256, items: {
      		type:'array', name: 'Coordinaten', min: 3, max: 256, items: {
      		  type: 'array', name: 'Pairs', min:2, max:2, items: {
      		    type: 'number', name:'Wert'
      		  }
      		}
	      }
	    }
	  }
	},
	StandModel : {
		name: {type:'string',name:'Name', min:1,max:4},
		desc: {type:'string',name:'Name', min:0,max:1024},
		type: {type:'set',items:[1,2,3,4],name:'Typ'},
		condition : { type:'object', name:'Zustand', optional:true ,model:{
				user: {type:'string',name:'Username', min:0,max:512},
				value: {type:'number',min:0.0, max:3.0}
		}},
		location : { type:'object', name:'Zustand', optional:true ,model:'Pointmodel' }
	},

	Drivestandmodel : {
	  stand : { type: 'string', name:'Stand' },
	  hunter : { type: 'string', name:'Schütze'},
	  route: {type:'string', name:'Anstellroute'}
	},

	Drivesmodel : {
	  shape : { name: 'Jagdfläche', type:'object', model: 'Shapemodel' },
	  routes : { name: 'Routen', type:'map', max:50 , model : 'Routemodel' },
	  stands : { name: 'Stände', type:'map', max:500 , model : 'Drivestandmodel' }
	},

	Planmodel : {
	  viewer: { name:'Beobachter', type:'map', items: { type:'number', min: 0, max: 4 } },
	  name:{name:'Name',type:'string',min:4, max:128},
	  desc:{name:'Beschreibung',type:'string',max:256,optional:true},
	  date:{name:'Datum',type:'date',min: function() { return new Date(); } },
	  leader: {name:'Jagdleiter', min: 8, optional: true },
	  backup: {name:'stellvertretender Jagdleiter', min: 8, optional: true },
	  drives : { name: 'Treiben', type:'array', max:4 , items: {
	    type: 'object', model:'Drivesmodel'
	  }},
	  invitestates: {}
	},

	Dogmodel : {
	  name:{name:'Name',type:'string',min:1, max:128},
	  type: { type:'set' , name:'Typ', items: [0,1] },
	  race:{name:'Rasse',type:'string',min:1, max:128},
	  examination:{name:'Prüfungen',type:'string',min:1, max:128, optional: true},
	  range: { type:'set' , name:'Stöberhundtyp', items: [0, 1, 2], optional: function ( i ) { return (i.type == 0) } },
	},

	Profilemodel : {
	  managed : {type:'bool',name:'Verwaltet'},
	  type: {type:'set', name:'Typ', items: [0,1,2,3], optional:true },
	  gender: {type:'set', name:'Anrede', items: [0,1] },
	  title : {type:'string', name:'Titel'},
	  firstname : {type:'string', name:'Vorname', min:1,max:120},
	  surname : {type:'string', name:'Nachname',min:1,max:120},
	  group : {type:'array', name:'Gruppe', max: 16, optional:true, items: {
	    type: 'string', min:1, max: 256
	  }},
	  phone1 : {type:'string', name:'Telefon', optional:true },
	  phone2 : {type:'string', name:'Telefon alternativ', optional:true },
	  isveterinary : { type:'bool', name:'Veterinär' , optional:true},
	  isdoctor : { type:'bool', name:'Humanmediziner', optional:true},
	  dogs : {type:'array',name:'Hunde', items: {
	    type:'object', model: 'Dogmodel'
	  }}
	},

	Managedprofilemodel : {
	  type: {type:'set', name:'Typ', items: [0,1,2,3] },
	  group : {type:'array', name:'Gruppe', max: 16, items: {
	    type: 'string', min:1, max: 256
	  }}
	},
}
