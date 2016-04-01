/*
  Diese Funktion sollte von jeder Methode in Meteor.methods({}) benutzt werden
  um die Rechte eines Benutzers zu prüfen.
    z.B.
      checkPermission( meteoruser , "administration.newUser" )
  um festzustellen ob der angemeldete Benutzer neue Benutzer erstellen darf.
*/
checkPermission = function( user , element ) {
  var opt = element.split('.');
  console.log( opt );
  if( user == null )
    throw new Meteor.Error(400, "Invalid User!");

  if( opt.length == 2 ) {
    if( user.profile.currentpath.length < 2 ) {
      throw new Meteor.Error(400, "You can't access a module function before selecting customer, department and role!");
    }
    var customer = Customers.findOne({_id:user.profile.currentpath[0]});
    if( customer == null )
      throw new Meteor.Error(400, "Invalid customer selected!");

    var department = customer.departments[ user.profile.currentpath[1] ];
    if( department == null )
      throw new Meteor.Error(400, "Invalid department selected!");

    var role = department.roles[ user.profile.currentpath[2] ];
    if( role == null )
      throw new Meteor.Error(400, "Invalid role selected!");

    if( role.modules[ opt[0] ] == null || role.modules[ opt[0] ].actions[ opt[1] ] == null )
      throw new Meteor.Error(403, "You have no access to the module "+opt[0]+" and function "+opt[1]+"!");

    return true;
  }
  throw new Meteor.Error(400, "The permission check has the wrong Format (module.function)!");
}
/*
  Diese Funktion stellt fest ob der übergebene Benutzer Serveradminrechte hat.
*/
isServerAdmin = function ( userid ) {
  var user = Meteor.users.findOne({_id:userid});
  if( user.isServerAdmin !== true )
    throw new Meteor.Error(403, "You need to be the server admin to do this!");
}
/*
  Diese Funktion evaluiert der Wert eines Feldes falls es sich um eines function
  handelt.
*/
function Value( data , obj ) {
  if (typeof(data) === "function") {
    return data( obj );
  }
  return data;
}
/*
  Diese Funktion überprüft ob item einem bestimmten Typ entspricht und sich
  innerhalb eines Wertebereichs befindet.
*/
ValidateType = function ( item , type, name, model, items, min, max, obj ) {

  type = Value(type, obj);
  name = Value(name, obj);
  model = Value(model, obj);
  items = Value(items, obj);
  min = Value(min, obj);
  max = Value(max, obj);

  switch( type ) {
    case 'bool':
      if( typeof(item) == "boolean" ) {
        return item;
      } else {
        throw new Meteor.Error(420, { id:key ,text:'Der Parameter '+name+' ist zu kein gültiger Wert.'});
      }
    break;

    case 'email':
      var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
      if( typeof(item) == "string" && re.test(item) ) {
        return item;
      } else {
        throw new Meteor.Error(420, { id:key ,text:'Der Parameter '+name+' ist zu keine gültige Emailadresse.'});
      }
    break;

    case 'set':
      if( items == null || ! (items instanceof Array) ) {
        throw new Meteor.Error(420, { id:key ,text:'Für den Parameter '+name+' sind keine zulässigen Elemente definiert.'});
      }
      for( var i=0; i < items.length;i++ ) {
        if( items[i] == item ) {
          return item;
        }
      }
      throw new Meteor.Error(420, { id:key ,text:'Der Parameter '+name+' liegt außerhalb des gültigen Bereichs.'});
    break;

    case 'string':

      if( typeof(item) == "string" ) {
        if( min ) {
          if( item.length < min )
            throw new Meteor.Error(420, { id:key ,text:'Der Text für Parameter '+name+' ist zu kurz (mindestens '+min+' Zeichen).'});
        }
        if( max ) {
          if( item.length > max )
            throw new Meteor.Error(420, { id:key ,text:'Der Parameter '+name+' ist zu lang (höchstens '+max+' Zeichen).'});
        }
        return item;
      } else {
        throw new Meteor.Error(420, { id:key ,text:'Der Parameter '+name+' ist zu keine gültige Zeichenkette.'});
      }

      break;
      case 'number':

        if( typeof(item) == "number" ) {
          if( min ) {
            if( item < min )
              throw new Meteor.Error(420, { id:key ,text:'Der Wert für Parameter '+name+' ist zu klein es sind nur Werte bis '+min+' zulässig.'});
          }
          if( max ) {
            if( item > max )
              throw new Meteor.Error(420, { id:key ,text:'Der Wert für Parameter '+name+' ist zu groß es sind nur Werte bis '+max+' zulässig.'});
          }
          return item;
        } else {
          throw new Meteor.Error(420, { id:key ,text:'Der Parameter '+name+' ist zu keine gültige Zahl.'});
        }

      break;
      case 'date':

        if( item instanceof Date  ) {
          if( min ) {
            if( item < min )
              throw new Meteor.Error(420, { id:key ,text:'Die Zeitangabe für Parameter '+name+' liegt ausserhalb des gültigen Bereichs. Zeitangaben vor dem '+moment(min).format('DD. MM. YYYY HH:MM')+' sind unzulässig.'});
          }
          if( max ) {
            if( item > max )
              throw new Meteor.Error(420, { id:key ,text:'Die Zeitangabe für Parameter '+name+' liegt ausserhalb des gültigen Bereichs. Zeitangaben nach dem '+moment(max).format('DD. MM. YYYY HH:MM')+' sind unzulässig.'});
          }
          return item;
        } else {
          throw new Meteor.Error(420, { id:key ,text:'Der Parameter '+name+' ist zu keine gültige Zeitangabe.'});
        }

      break;
      case 'array':

        if( item instanceof Array ) {
          if( min ) {
            if( item.length < min)
              throw new Meteor.Error(420, { id:key ,text:'Der Array '+name+' enthält zu wenige Elemente. Es müssen mindestens '+min+' Elemente enthalten sein.'});
          }
          if( max ) {
            if( item.length > max )
              throw new Meteor.Error(420, { id:key ,text:'Der Array '+name+' enthält zu viele Elemente. Es dürfen höchstens '+max+' Elemente enthalten sein.'});
          }

          var data = [];
          for( var i=0;i < item.length;i++ ) {
            data.push( ValidateType( item[i] , items.type, name+"."+items.name,items.model, items.items, items.min, items.max, data ) );
          }
          return data;
        } else {
          throw new Meteor.Error(420, { id:key ,text:'Der Parameter '+name+' ist zu kein gültiger Array.'});
        }

      break;

      case 'map':
        if( item instanceof Object ) {
          var data = {};
          for( var n in item ) {
            data[n] = ValidateType( item[n] , items.type, name+"."+items.name, items.model, items.items, items.min, items.max, data );
          }
          return data;
        } else {
          throw new Meteor.Error(420, { id:key ,text:'Der Parameter '+name+' ist zu keine gültige Tabelle.'});
        }
      break;

      case 'object':
        if( item instanceof Object ) {
          if(  typeof(model) == "string" ) {
            return Validate( item , DataModels[model] );
          } else {
            return Validate( item , model );
          }
        } else {
          throw new Meteor.Error(420, { id:key ,text:'Der Parameter '+name+' ist zu kein gültiges Objekt.'});
        }
      break;
  }
}
/*
  Diese Funktion überprüft ob data einem bestimmten Schema entspricht und die
  einzelnen Werte innerhalb der Vorgaben befinden. Es wird eine Kopie der Daten
  erzeugt die nur die Felder enthält die auch im Model definiert wurden.
*/
Validate = function( data, model ) {
  var clean = {};

  if(  typeof(model) == "string" ) {
    model = DataModels[model];
  }

  for( key in model ) {

    if( (data[key] == null || data[key] == '') && Value(model[key].optional,data) == true ) {
      continue;
    }

    if( data[key] == null ) {
      throw new Meteor.Error(420, { id:key ,text:'Der Parameter '+model[key].name+' fehlt!'});
    }
    clean[key] = ValidateType( data[key] , model[key].type, model[key].name, model[key].model, model[key].items, model[key].min, model[key].max, clean );
  }
  return clean;
}
