function generateArray(table) {
    var out = [];
    var ranges = [];

    $(table).find('tr').each( function( r, otr ) {
      var outRow = [];
      var row = $(otr);
      row.children('td').each( function( c, otd ) {
        var cell = $(otd);
        if( cell.hasClass('no-export') )
          return;

        var colspan = cell.attr('colspan');
        var rowspan = cell.attr('rowspan');
        var cellValue = otd.innerText;

        if(cellValue !== "" && cellValue == +cellValue) cellValue = +cellValue;

        //Skip ranges
        ranges.forEach(function(range) {
          if(r >= range.s.r && r <= range.e.r && outRow.length >= range.s.c && outRow.length <= range.e.c) {
            for(var i = 0; i <= range.e.c - range.s.c; ++i) outRow.push(null);
          }
        });

        //Handle Row Span
        if (rowspan || colspan) {
          rowspan = rowspan || 1;
          colspan = colspan || 1;
          ranges.push({s:{r:r, c:outRow.length},e:{r:r+rowspan-1, c:outRow.length+colspan-1}});
        };

        //Handle Value
        outRow.push(cellValue !== "" ? cellValue : null);

        //Handle Colspan
        if (colspan) for (var k = 0; k < colspan - 1; ++k) outRow.push(null);

      })
      out.push(outRow);
    })
    return [out, ranges];
};

function datenum(v, date1904) {
	if(date1904) v+=1462;
	var epoch = Date.parse(v);
	return (epoch - new Date(Date.UTC(1899, 11, 30))) / (24 * 60 * 60 * 1000);
}

function sheet_from_array_of_arrays(data, opts) {
	var ws = {};
	var range = {s: {c:10000000, r:10000000}, e: {c:0, r:0 }};
	for(var R = 0; R != data.length; ++R) {
		for(var C = 0; C != data[R].length; ++C) {
			if(range.s.r > R) range.s.r = R;
			if(range.s.c > C) range.s.c = C;
			if(range.e.r < R) range.e.r = R;
			if(range.e.c < C) range.e.c = C;
			var cell = {v: data[R][C] };
			if(cell.v == null) continue;
			var cell_ref = XLSX.utils.encode_cell({c:C,r:R});

			if(typeof cell.v === 'number') cell.t = 'n';
			else if(typeof cell.v === 'boolean') cell.t = 'b';
			else if(cell.v instanceof Date) {
				cell.t = 'n'; cell.z = XLSX.SSF._table[14];
				cell.v = datenum(cell.v);
			}
			else cell.t = 's';

			ws[cell_ref] = cell;
		}
	}
	if(range.s.c < 10000000) ws['!ref'] = XLSX.utils.encode_range(range);
	return ws;
}

function Workbook() {
	if(!(this instanceof Workbook)) return new Workbook();
	this.SheetNames = [];
	this.Sheets = {};
}

function s2ab(s) {
	var buf = new ArrayBuffer(s.length);
	var view = new Uint8Array(buf);
	for (var i=0; i!=s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
	return buf;
}

SaveTableAsExcel = function(id,filename) {
  var theTable = document.getElementById(id);
  var oo = generateArray(theTable);
  var ranges = oo[1];

  /* original data */
  var data = oo[0];
  var ws_name = id;

  var wb = new Workbook(), ws = sheet_from_array_of_arrays(data);

  /* add ranges to worksheet */
  ws['!merges'] = ranges;

  /* add worksheet to workbook */
  wb.SheetNames.push(ws_name);
  wb.Sheets[ws_name] = ws;

  var wbout = XLSX.write(wb, {bookType:'xlsx', bookSST:false, type: 'binary'});

  var buffer = new ArrayBuffer(wbout.length);
  var view = new Uint8Array(buffer);
  for (var i=0; i!=wbout.length; ++i) {
    view[i] = wbout.charCodeAt(i) & 0xFF;
  }
  Meteor.saveAs(new Blob([ buffer ],{type:"application/octet-stream"}), filename )
}
