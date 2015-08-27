//**********************************************************************
//
//  Template: participants
//
//**********************************************************************

CrossDomainImage = function( iframe ) {

  alert(iframe)
}

function getParticipants() {
  var plan = Plans.findOne({_id:Meteor.user().profile.currentSelectedPlan});
  var data = {};
  var group = 1;
  if( plan ) {
    Routes.find({plan:plan._id}).forEach( function (route) {
      for( sid in route.stands ) {
        if( route.stands[sid].name != '' && route.stands[sid].surname != '' ) {
          var stand = Stands.findOne({_id:sid});
          var key = MD5( route.stands[sid].name+'-'+route.stands[sid].surname);
          data[ key ] = {
            key:key,
            email   : route.stands[sid].email,
            name    : route.stands[sid].name,
            surname : route.stands[sid].surname,
            func    : 'Schütze',
            group   : group,
            stand   : (stand) ? stand.name:'-',
            standid : sid,
            state   : (plan.invitestates && plan.invitestates[key]) ? plan.invitestates[key]:{uninvited:true}
          };
        }
      }
      if( route.name != '' && route.surname != '' ) {
        var key = MD5(route.name+'-'+route.surname);
        data[ key ] = {
          key:key,
          email: route.email,
          name: route.name,
          surname:route.surname,
          func:'Ansteller',
          group:group,
          stand   : (data[ key ]) ? data[ key ].stand:'-',
          standid : (data[ key ]) ? data[ key ].standid:'',
          state : (plan.invitestates && plan.invitestates[key]) ? plan.invitestates[key]:{uninvited:true}
        };
      }
      group++;
    })
  }
  return _.values(data);
}

function GetWMSImageUrl( bounds, size ) {
  /*var projection = window.map.getProjection();
  var zpow = Math.pow(2, zoom);
  var ul = new google.maps.Point(tile.x * 256.0 / zpow, (tile.y + 1) * 256.0 / zpow);
  var lr = new google.maps.Point((tile.x + 1) * 256.0 / zpow, (tile.y) * 256.0 / zpow);
  var ulw = projection.fromPointToLatLng(ul);
  var lrw = projection.fromPointToLatLng(lr);
  var ratio = w/h;*/

  var ne = bounds.getNorthEast();
  var sw = bounds.getSouthWest();
  var c = bounds.getCenter();

  var cw = Math.abs( ne.lat()-sw.lat() );
  var ch = Math.abs( ne.lng()-sw.lng() );
  var d = Math.max(cw,ch) / 2;




  //The user will enter the address to the public WMS layer here.  The data must be in WGS84

  var baseURL = "http://www.brandenburg-forst.de:8080/geoserver/wms_ext/wms"
  //var baseURL = "http://demo.cubewerx.com/cubewerx/cubeserv.cgi?";
  var version = "1.3.0";
  var request = "GetMap";
  var format = "image%2Fpng"; //type of image returned  or image/jpeg
  //The layer ID.  Can be found when using the layers properties tool in ArcMap or from the WMS settings
  var layers = "wms_ext:arcgis_raster";//"Foundation.GTOPO30";
  //projection to display. This is the projection of google map. Don't change unless you know what you are doing.
  //Different from other WMS servers that the projection information is called by crs, instead of srs
  var crs = "EPSG:4326";
  //With the 1.3.0 version the coordinates are read in LatLon, as opposed to LonLat in previous versions
  var bbox = (c.lng()-d) + "," + (c.lat()-d) + "," + (c.lng()+d) + "," + (c.lat()+d);
  var service = "WMS";
  //the size of the tile, must be 256x256
  var width = size;//"256";
  var height = size;//"256";
  //Some WMS come with named styles.  The user can set to default.
  var styles = "default";
  //Establish the baseURL.  Several elements, including &EXCEPTIONS=INIMAGE and &Service are unique to openLayers addresses.
  var url = baseURL + "?Service=" + service + "&Layers=" + layers + "&EXCEPTIONS=INIMAGE" + "&request=" + request + "&format=" + format + /*"&Styles=" + styles +*/ /*"&CRS=" + crs */ "&BBOX=" + bbox + "&width=" + width + "&height=" + height;

  return url;
}

function addTextCenter( doc, x, y, w, text, size ) {

  doc.setFontSize(size);
  var d = doc.getStringUnitWidth(text)*size / 72 * 25.6;
  while( d > w ) {
    text = text.substr(0,text.length-2)+'.';
    d = doc.getStringUnitWidth(text)*size / 72 * 25.6;
  }
  var o = x+(w-d)*0.5;
  doc.text(text,o,y);
}

function pixelDist( m, zoom ) {
  var p = Math.pow(2,zoom);
  var u = 360 / (6378137*2*Math.PI);
  return m * u * p;
}

function pixelDistGrad(a, zoom ) {
  var p = Math.pow(2,zoom);
  return a * p;
}

function roundRect( ctx, x, y, w, h, r ) {
  ctx.moveTo(x+r,y);
  ctx.lineTo(x+w-r,y);
  ctx.arcTo(x+w,y,x+w,y+r,r);
  ctx.lineTo(x+w,y+h-r);
  ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
  ctx.lineTo(x+r,y+h);
  ctx.arcTo(x,y+h,x,y+h-r,r);
  ctx.lineTo(x,y+r);
  ctx.arcTo(x,y,x+r,y,r);
}

Template.huntingoffice.participants = function() {
  return getParticipants();
}

Template.huntingoffice.plan = function () {
  return Plans.findOne({_id:Meteor.user().profile.currentSelectedPlan});
}

Template.huntingoffice.events({
  'click .modal-close': function( e ) {
    Session.set('modal',null);
  },
  'click #download-participants': function( e ) {

    var button = $(e.currentTarget);
    var progress = $('<div class="progress"><div id="download-hunterplans-progress" class="progress-bar progress-bar-striped active"  role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%"></div></div>').append(progress_bar)
    button.parent().append(progress)
    var progress_bar = $('#download-hunterplans-progress')
    button.hide();
    var progress_value = 0;

    var data = getParticipants();

    data.sort( function ( a, b) {
      var an = a.surname+a.name;
      var bn = b.surname+b.name;
      if (an < bn){ return -1; };
      if (an > bn){ return 1; };
      return 0;
    })

    var doc = new jsPDF('p','mm','a4');
    var ml = 20;
    var mr = 210-20;
    var line = 8;
    var columns = [
      {name:'Nachname, Vorname',p:0},
      {name:'Stand',p:80},
      {name:'Gruppe',p:94},
      {name:'Jagdschein',p:110},
      {name:'Unterschrift',p:133}
    ];
    var cy = 20;

    function createHeader( ) {
      // create header;
      doc.setFont("helvetica");
      doc.setFontType("bold");
      doc.setFontSize(10);
      // Filled square
      doc.setFillColor(180, 180, 180)
      doc.rect(ml, cy, 170, line, 'F');
      doc.setDrawColor(0, 0, 0).setLineWidth(0.2);
      doc.line(ml,cy,mr,cy);
      for( var c=0;c < columns.length;c++ ) {
        doc.line( ml+columns[c].p,cy,ml+columns[c].p,cy+line );
        doc.text( ml+columns[c].p+2,cy+line-2,columns[c].name);
      }
      doc.line(mr,cy,mr,cy+line);
      cy += line;
      doc.line(ml,cy,mr,cy);
    }
    createHeader();
    doc.setFontType("normal");
    doc.setFontSize(9);
    for( var l=0;l <  data.length;l++ ) {
      for( var c=0;c < columns.length;c++ ) {
        doc.line( ml+columns[c].p,cy,ml+columns[c].p,cy+line );
        switch(c) {
          case 0:
            var str = data[l].surname+", "+data[l].name;
            doc.text( ml+columns[c].p+2,cy+line-2,str);
          break;
          case 1:
            doc.text( ml+columns[c].p+2,cy+line-2,''+data[l].stand);
          break;
          case 2:
            var g = ''+data[l].group;
            if( data[l].func == 'Ansteller') {
              g += ' (A)';
            }
            doc.text( ml+columns[c].p+2,cy+line-2,g);
          break;
        }
      }
      doc.line(mr,cy,mr,cy+line);
      cy += line;
      doc.line(ml,cy,mr,cy);
      if( (cy+line) > 277 ) {
        doc.addPage();
        cy = 20;
        createHeader();
      }
      var v = l/data.length;
      progress_bar.css('width',(v*100)+"%")
    }
    doc.output('save',"Teilnehmerliste.pdf");
    progress.remove();
    button.show();
    delete doc;
  },
  'click #download-guideplans': function(e) {

    var button = $(e.currentTarget);
    var progress = $('<div class="progress"><div id="download-hunterplans-progress" class="progress-bar progress-bar-striped active"  role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%"></div></div>').append(progress_bar)
    button.parent().append(progress)
    var progress_bar = $('#download-hunterplans-progress')
    button.hide();
    var progress_value = 0;

    function getCoords( org, com, zoom ) {
      var p = Math.pow(2,zoom);
      var la = (com.lat-org.lat()) * p;
      var lo = (com.lng-org.lng()) * p;
      return {x: (lo*(128/180)+300)*2 ,y:((la*-(180/155))+300)*2};
    }

    var doc = new jsPDF('p','mm','a4');
    var plan = Plans.findOne({_id:Meteor.user().profile.currentSelectedPlan});
    var pendings = {};
    var routes = [];
    var first = true;

    var group = 1;
    var routecount=0;
    Routes.find({plan:plan._id}).forEach( function( route ) {
      var bounds = getPathBounds( route.path );
      var c = bounds.getCenter();
      var ne = bounds.getNorthEast();

      var le = Math.max( Math.abs( ne.lat()-c.lat()) , Math.abs( ne.lng()-c.lng()) );
      var zoom = 18;
      var dist = pixelDistGrad( le , zoom );
      while( dist >= 300 && zoom > 1 ) {
        zoom--;
        dist = pixelDistGrad( le , zoom );
      }
      pendings[ route._id ] = true;
      var img = document.createElement("img");
      img.crossOrigin = "http://profile.ak.fbcdn.net/crossdomain.xml";
      img.src = GetWMSImageUrl(bounds,600)
      //img.src = "http://maps.googleapis.com/maps/api/staticmap?center="+c.lat()+','+c.lng()+"&zoom="+zoom+"&size=600x600&maptype=satellite&sensor=false";

      img.data = 1;
      img.group = group;
      img.center = c;
      img.zoom = zoom;
      img.route = route;
      img.onload = function ( ) {
        var self = this;
        var canvas = document.createElement("canvas");
        canvas.width = this.width * 2;
        canvas.height = this.height * 2;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(this,0,0,this.width,this.height,0,0,this.width*2,this.height*2 );

        ctx.fillStyle="rgba(255,255,255,0.2)";
        ctx.beginPath();
        ctx.rect(0,0,1200,1200);
        ctx.fill();

        ctx.font="14px Arial";

        var plan = Plans.findOne({_id:Meteor.user().profile.currentSelectedPlan});
        if( plan ) {
          for( var ac=0; ac < plan.areas.length;ac++ ) {
            var area = Areas.findOne({_id:plan.areas[ac]} );
            if( area && area.shape && area.shape.length ) {
              ctx.beginPath();
              var a = getCoords( self.center, area.shape[0], self.zoom );
              ctx.moveTo( a.x, a.y )
              for( var i=1;i < area.shape.length;i++ ) {
                var p = getCoords( self.center, area.shape[i], self.zoom )
                ctx.lineTo(p.x,p.y);
              }
              ctx.lineTo(a.x,a.y);
              ctx.strokeStyle="rgba(255,255,255,1)";
              ctx.fillStyle="rgb(255,255,255,0.3)";
              ctx.lineCap="round";
              ctx.lineWidth=2;
              ctx.stroke();
              ctx.fill();
            }
          }
          Routes.find({plan:plan._id}).forEach( function( route ) {
            ctx.beginPath();
            var p = getCoords( self.center, route.path[0], self.zoom );
            ctx.moveTo( p.x, p.y )
            for( var i=1;i < route.path.length;i++ ) {
              p = getCoords( self.center, route.path[i], self.zoom )
              ctx.lineTo(p.x,p.y);
            }
            ctx.strokeStyle="rgba(0,0,0,0.5)";
            ctx.lineCap="round";
            ctx.lineWidth=8;
            ctx.stroke();
            ctx.strokeStyle="rgba(128,128,128,1)";
            ctx.lineWidth=4;
            ctx.stroke();
            for( sid in route.stands ) {
              var stand = Stands.findOne( {_id:sid} );
              if( stand ) {
                p = getCoords( self.center, stand.position, self.zoom )
                var txt = stand.name;
                var w = ctx.measureText(txt).width;
                var rw = Math.max(w+8,12);
                ctx.strokeStyle ="rgba(0,0,0,0.5)";
                ctx.lineWidth = 3;
                ctx.fillStyle="rgba(128,128,128,1)";
                ctx.beginPath();
                roundRect( ctx,p.x-rw*0.5,p.y-14,rw,16, 4 )
                ctx.stroke();
                ctx.fill();
                ctx.fillStyle="rgb(0,0,0)";
                ctx.fillText(txt,p.x-w*0.5,p.y );
              }
            }
          })
        }

        ctx.beginPath();
        var p = getCoords( self.center, self.route.path[0], self.zoom );
        ctx.moveTo( p.x, p.y )
        for( var i=1;i < this.route.path.length;i++ ) {
          p = getCoords( self.center, self.route.path[i], self.zoom )
          ctx.lineTo(p.x,p.y);
        }
        ctx.strokeStyle="rgba(0,0,0,0.5)";
        ctx.lineCap="round";
        ctx.lineWidth=8;
        ctx.stroke();
        ctx.strokeStyle="rgba(255,200,200,1)";
        ctx.lineWidth=4;
        ctx.stroke();


        var hunters = [['Stand','Name, Vorname','Unterschrift']];
        for( sid in this.route.stands ) {
          var stand = Stands.findOne( {_id:sid} );
          if( stand ) {
            p = getCoords( self.center, stand.position, self.zoom )
            var txt = stand.name;
            var w = ctx.measureText(txt).width;
            var rw = Math.max(w+8,12);
            ctx.strokeStyle ="rgba(0,0,0,0.5)";
            ctx.lineWidth = 3;
            ctx.fillStyle="rgba(255,200,200,1)";
            ctx.beginPath();
            roundRect( ctx,p.x-rw*0.5,p.y-14,rw,16, 4 )
            ctx.stroke();
            ctx.fill();
            ctx.fillStyle="rgb(0,0,0)";
            ctx.fillText(txt,p.x-w*0.5,p.y );
            if( self.route.stands[sid].surname ) {
              hunters.push([
                stand.name,
                self.route.stands[sid].surname+', '+self.route.stands[sid].name,
                ''
              ]);
            } else {
              hunters.push([
                stand.name,
                '',
                ''
              ]);
            }

          }
        }

        doc.setFont("helvetica");
        doc.rect(170,16,20,33-16+3,'D')
        doc.setFontType("normal");
        addTextCenter( doc, 170, 20,20,"Gruppe", 6 );
        doc.setFontType("bold");
        addTextCenter( doc, 170, 33,20,''+this.group, 42 );

        doc.rect(20,16,170,33-16+3,'D')
        doc.setFontSize(6);
        doc.setFontType("normal");
        doc.text("Ansteller",21,20 );
        doc.setFontSize(14);
        doc.text( this.route.surname+', '+this.route.name, 21,33 );

        doc.addImage(canvas.toDataURL("image/jpeg"),'jpeg', 20, 38, 170, 170);

        doc.setFontSize(10)
        doc.setDrawColor(0,0,0);
        var line = 5;
        var cy = 210;
        var columns = [30,80,80];
        doc.line(20,cy,190,cy);
        for( var l=0;l < hunters.length && cy < 285;l++ ) {
          var cx = 20;
          if( l==0 ) {
            doc.setFillColor(180, 180, 180)
            doc.rect(cx, cy, 170, line, 'F');
          }
          doc.line(cx,cy,cx,cy+line);
          for( var c=0;c < columns.length;c++ ) {
            doc.text( hunters[l][c], cx+1, cy+(line-1) );
            cx += columns[c];
            doc.line(cx,cy,cx,cy+line);
          }
          doc.line(190,cy,190,cy+line);
          doc.line(20,cy,190,cy);
          cy+=line;
        }
        doc.line(20,cy,190,cy);

        progress_value++;
        var v = progress_value/routecount;
        progress_bar.css('width',(v*100)+"%")

        delete pendings[ this.route._id ];
        if(_.size(pendings) == 0 ) {
          doc.output('save',"Ansteller.pdf");
          progress.remove();
          button.show();
        } else {
          doc.addPage();
        }
        delete this;
      }
      group++;
      routecount++;
    })
  },
  'click #download-hunterplans': function (e) {

    var button = $(e.currentTarget);
    var progress = $('<div class="progress"><div id="download-hunterplans-progress" class="progress-bar progress-bar-striped active"  role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%"></div></div>').append(progress_bar)
    button.parent().append(progress)
    var progress_bar = $('#download-hunterplans-progress')
    button.hide();
    var progress_value = 0;

    function getCoords( org, com, zoom ) {
      var p = Math.pow(2,zoom);
      var la = (com.lat-org.lat) * p;
      var lo = (com.lng-org.lng) * p;
      return {x:lo*(128/180),y:la*(180/155)};
    }

    function getCone( org, com ) {
      var h = (((270+google.maps.geometry.spherical.computeHeading( new google.maps.LatLng(org.lat,org.lng), new google.maps.LatLng(com.lat,com.lng) ))%360) / 360) * 2 * Math.PI;
      return { min:(h - 10/180*Math.PI), max:(h + 10/180*Math.PI) };
    }

    var doc = new jsPDF('p','mm','a4');
    var plan = Plans.findOne({_id:Meteor.user().profile.currentSelectedPlan});
    var pendings = {};
    var stands = [];
    var first = true;
    var zoom = 18;
    var r150 = pixelDist( 150, zoom );
    var r100 = pixelDist( 100, zoom );
    var r50 = pixelDist( 50, zoom );

    var group = 1;
    Routes.find({plan:plan._id}).forEach( function( route ) {
      for( sid in route.stands ) {
        var stand = Stands.findOne( {_id:sid });
        if( stand ) {
          stand['route'] = group;
          stand['hunter'] = { name:route.stands[sid].name, surname: route.stands[sid].surname} ;
          stand['guide'] = { name:route.name, surname: route.surname, phone: route.tel };
          stands.push( stand );
          pendings[ sid ] = true;
        }
      }
      group++;
    })

    stands.sort( function( a,b ) {
      return (a.group-b.group);
    })

    for( var s=0;s < stands.length;s++ ) {
      var img = document.createElement("img");
      img.crossOrigin = "anonymous";
      img.src = "http://maps.googleapis.com/maps/api/staticmap?center="+stands[s].position.lat+','+stands[s].position.lng+"&zoom="+zoom+"&size=600x600&maptype=satellite&sensor=false";
      img.data = 1;
      img.stand = stands[s];
      img.onload = function ( ) {
        console.log("Add Page for Stand "+this.stand._id);
        var canvas = document.createElement("canvas");
        canvas.width =this.width;
        canvas.height =this.height;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(this,0,0 );

        ctx.fillStyle="rgba(255,255,255,0.3)";
        ctx.beginPath();
        ctx.rect(0,0,600,600);
        ctx.fill();
        ctx.fillStyle="rgba(255,255,255,0.4)";
        ctx.beginPath();
        ctx.arc(300,300,r150,0,Math.PI*2);
        ctx.fill();

        var inlist = [];
        for( var os = 0; os < stands.length;os++ ) {
          var pos = getCoords( this.stand.position , stands[os].position, zoom );
          if( pos.x > -600 && pos.x < 600 && pos.y > -600 && pos.y < 600 ) {
            inlist.push( {pos:pos, stand:stands[os], self: (stands[os]._id==this.stand._id) });
          }
        }
        ctx.fillStyle="rgba(255,0,0,0.4)";

        for( var i=0;i < inlist.length;i++ ) {
          if( ! inlist[i].self ) {
            var cone = getCone(this.stand.position , inlist[i].stand.position );
            ctx.beginPath();
            ctx.moveTo(300,300);
            ctx.arc(300,300,r150,cone.min,cone.max);
            ctx.moveTo(300,300);
            ctx.fill();
          }
        }
        ctx.font="12px Arial";
        ctx.strokeStyle='rgb(0,0,0)';
        ctx.fillStyle='rgb(0,0,0)';
        ctx.beginPath();
        ctx.arc(300,300,r150,0,2*Math.PI);
        ctx.stroke();
        var r2 = 1/1.44;
        ctx.fillText('150m',300-(r150)*r2 + 2,300-(r150)*r2 + 2 );
        ctx.beginPath();
        ctx.arc(300,300,r100,0,2*Math.PI);
        ctx.stroke();
        ctx.fillText('100m',300-(r100)*r2 + 4,300-(r100)*r2  + 4);
        ctx.beginPath();
        ctx.arc(300,300,r50,0,2*Math.PI);
        ctx.stroke();
        ctx.fillText('50m',300-(r50)*r2 + 6,300-(r50)*r2 + 6);


        ctx.font="20px Arial";

        for( var i=0;i < inlist.length;i++ ) {
          var x = (inlist[i].pos.x*1)+300;
          var y = (inlist[i].pos.y*-1)+300;
          var txt =inlist[i].stand.name;
          var w = ctx.measureText(txt).width;
          var rw = Math.max(w+8,25);
          ctx.shadowBlur=10;
          ctx.shadowColor ="black";
          ctx.strokeStyle ="rgba(255,255,255,1.0)";
          ctx.strokeWidth = 2;
          ctx.fillStyle="rgba(255,255,255,0.7)";
          ctx.beginPath();
          roundRect( ctx,x-rw*0.5,y-14,rw,28, 4 )
          ctx.fill();
          ctx.stroke();
          ctx.shadowBlur=0;
          ctx.fillStyle="rgb(0,0,0)";
          ctx.fillText(txt,x-w*0.5,y+8 );
        }

        if( first ) {
          first = false;
        } else {
          doc.addPage();
        }

        doc.setFont("helvetica");
        doc.rect(170,16,20,33-16+3,'D')
        doc.setFontType("normal");
        addTextCenter( doc, 170, 20,20,"Gruppe", 6 );
        doc.setFontType("bold");
        addTextCenter( doc, 170, 33,20,''+this.stand.route, 42 );

        doc.rect(130,16,40,33-16+3,'D')
        doc.setFontType("normal");
        addTextCenter( doc, 130, 20,40,"Stand", 6 );
        doc.setFontType("bold");
        addTextCenter( doc, 130, 33,40,''+this.stand.name, 42 );

        doc.rect(20,16,110,10,'D')
        doc.setFontSize(6);
        doc.setFontType("normal");
        doc.text("Ansteller",21,20 );
        doc.setFontSize(10);
        doc.text( this.stand.guide.surname+', '+this.stand.guide.name+' | Tel.: '+this.stand.guide.phone,21,24 );

        doc.rect(20,26,110,10,'D')
        doc.setFontSize(6);
        doc.setFontType("normal");
        doc.text("Schütze",21,30 );
        doc.setFontSize(10);
        if( this.stand.hunter.surname != '' ) {
          doc.text(this.stand.hunter.surname+', '+this.stand.hunter.name,21,34);
        }
        doc.addImage(canvas.toDataURL("image/jpeg"),'jpeg', 20, 38, 170, 170);
        doc.setDrawColor(0,0,0);
        var cy = 210;
        doc.setFillColor(180, 180, 180)
        doc.rect(20, cy, 170, 8, 'F');
        for( var l=0;l < 9;l++ ) {
          doc.line(20,cy,190,cy);
          cy+=8;
        }
        doc.line(20,cy,190,cy);
        doc.setFontSize(10)
        var cx = 22;
        doc.line(cx-2,210,cx-2,cy);
        doc.text('#',cx,217);
        cx+=6;
        doc.line(cx-2,210,cx-2,cy);
        doc.text('Zeit',cx,217);
        cx+=16;
        doc.line(cx-2,210,cx-2,cy);
        doc.text('Wildart',cx,217);
        cx+=30;
        doc.line(cx-2,210,cx-2,cy);
        doc.text('AK',cx,217);
        cx+=10;
        doc.line(cx-2,210,cx-2,cy);
        doc.text('m/w',cx,217);
        cx+=12;
        doc.line(cx-2,210,cx-2,cy);
        doc.text('Wildmarke',cx,217);
        cx+=42;
        doc.line(cx-2,210,cx-2,cy);
        doc.text('A',cx,217);
        cx+=7;
        doc.line(cx-2,210,cx-2,cy);
        doc.text('B',cx,217);
        cx+=7;
        doc.line(cx-2,210,cx-2,cy);
        doc.text('Unterschrift',cx,217);
        doc.line(190,210,190,cy);

        progress_value++;
        var v = progress_value/stands.length;
        progress_bar.css('width',(v*100)+"%")

        delete pendings[ this.stand._id ];
        if(_.size(pendings) == 0 ) {
          doc.output('save',"Schützen.pdf");
          progress.remove();
          button.show();
        }
        delete this;
      }
    }
  },
  'click .set-uninvited':function( e ) {
    var key = $(e.currentTarget).attr('data');
    Meteor.call('removeInviteState', Meteor.user().profile.currentSelectedPlan, key );
  },
  'click .set-invited-success':function( e ) {
    var key = $(e.currentTarget).attr('data');
    Meteor.call('setInviteState', Meteor.user().profile.currentSelectedPlan, key, {invited_success:true} );
  },
  'click .set-invited-refused':function( e ) {
    var key = $(e.currentTarget).attr('data');
    Meteor.call('setInviteState', Meteor.user().profile.currentSelectedPlan, key, {invited_refused:true} );
  }
})
