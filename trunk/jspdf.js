
/**
 * jsPDF
 * (c) 2009 James Hall
 * 
 * Some parts based on FPDF.
 */

var jsPDF = function(){
	
	// Private properties
	var version = '0.1';
	var buffer = '';
	
	var pdfVersion = '1.3'; // PDF Version
	var defaultPageFormat = 'a4';
	var pageFormats = { // Size in mm of various paper formats
		'a3': [841.89, 1190.55],
		'a4': [595.28, 841.89],
		'a5': [420.94, 595.28],
		'letter': [612, 792],
		'legal': [612, 1008]
	};
	var textColor = '0 g';
	var page = 0;
	var objectNumber = 2; // 'n' Current object number
	var state = 0; // Current document state
	var pages = new Array();
	var offsets = new Array(); // List of offsets
	var lineWidth = 0.200025; // 2mm
	var pageHeight;
	var k; // Scale factor
	var unit = 'mm'; // Default to mm for units
	var fontNumber; // TODO: This is temp, replace with real font handling
	
	// Private functions
	var newObject = function() {
		//Begin a new object
		objectNumber ++;
		offsets[objectNumber] = buffer.length;
		out(objectNumber + ' 0 obj');		
	}
	
	
	var putHeader = function() {
		out('%PDF-' + pdfVersion);
	}
	
	var putPages = function() {
		
		// TODO: Fix, hardcoded to a4 portrait
		var wPt = pageWidth * k;
		var hPt = pageHeight * k;

		for(n=1; n <= page; n++) {
			newObject();
			out('<</Type /Page');
			out('/Parent 1 0 R');	
			out('/Resources 2 0 R');
			out('/Contents ' + (objectNumber + 1) + ' 0 R>>');
			out('endobj');
			
			//Page content
			p = pages[n];
			newObject();
			out('<</Length ' + p.length  + '>>');
			putStream(p);
			out('endobj');					
		}
		offsets[1] = buffer.length;
		out('1 0 obj');
		out('<</Type /Pages');
		var kids='/Kids [';
		for (i = 0; i < page; i++) {
			kids += (3 + 2 * i) + ' 0 R ';
		}
		out(kids + ']');
		out('/Count ' + page);
		out(sprintf('/MediaBox [0 0 %.2f %.2f]', wPt, hPt));
		out('>>');
		out('endobj');		
	}
	
	var putStream = function(str) {
		out('stream');
		out(str);
		out('endstream');
	}
	
	var putResources = function() {
		putFonts();
		putImages();
		
		//Resource dictionary
		offsets[2] = buffer.length;
		out('2 0 obj');
		out('<<');
		putResourceDictionary();
		out('>>');
		out('endobj');
	}	
	
	var putFonts = function() {
		// TODO: Only supports core font hardcoded to Helvetica
		newObject();
		fontNumber = objectNumber;
		name = 'Helvetica-Bold';
		out('<</Type /Font');
		out('/BaseFont /' + name);
		out('/Subtype /Type1');
		out('/Encoding /WinAnsiEncoding');
		out('>>');
		out('endobj');
	}
	
	var putImages = function() {
		// TODO
	}
	
	var putResourceDictionary = function() {
		out('/ProcSet [/PDF /Text /ImageB /ImageC /ImageI]');
		out('/Font <<');
		//foreach($this->fonts as $font)
		//	$this->_out('/F'.$font['i'].' '.$font['n'].' 0 R');
		out('/F1 ' + fontNumber + ' 0 R');
		out('>>');
		out('/XObject <<');
		putXobjectDict();
		out('>>');
	}
	
	var putXobjectDict = function() {
		// TODO
		// Loop through images
	}
	
	
	var putInfo = function() {
		out('/Producer (jsPDF ' + version + ')');
		//if(!empty($this->title))
		//	$this->_out('/Title '.$this->_textstring($this->title));
		//if(!empty($this->subject))
		//	$this->_out('/Subject '.$this->_textstring($this->subject));
		//if(!empty($this->author))
		//	$this->_out('/Author '.$this->_textstring($this->author));
		//if(!empty($this->keywords))
		//	$this->_out('/Keywords '.$this->_textstring($this->keywords));
		//if(!empty($this->creator))
		//	$this->_out('/Creator '.$this->_textstring($this->creator));
		out('/CreationDate (D:20091012101212)');
	}
	
	var putCatalog = function () {
		out('/Type /Catalog');
		out('/Pages 1 0 R');
		// TODO: Add zoom and layout modes
		out('/OpenAction [3 0 R /FitH null]');
		out('/PageLayout /OneColumn');
	}	
	
	function putTrailer()
	{
		out('/Size ' + (objectNumber + 1));
		out('/Root ' + objectNumber + ' 0 R');
		out('/Info ' + (objectNumber - 1) + ' 0 R');
	}	
	
	var endDocument = function() {
		state = 1;
		putHeader();
		putPages();
		
		putResources();
		//Info
		newObject();
		out('<<');
		putInfo();
		out('>>');
		out('endobj');
		
		//Catalog
		newObject();
		out('<<');
		putCatalog();
		out('>>');
		out('endobj');
		
		//Cross-ref
		var o = buffer.length;
		out('xref');
		out('0 ' + (objectNumber + 1));
		out('0000000000 65535 f ');
		for (var i=1; i <= objectNumber; i++) {
			out(sprintf('%010d 00000 n ', offsets[i]));
		}
		//Trailer
		out('trailer');
		out('<<');
		putTrailer();
		out('>>');
		out('startxref');
		out(o);
		out('%%EOF');
		state = 3;		
	}
	
	var beginPage = function() {
		page ++;
		// Do dimension stuff
		state = 2;
		pages[page] = '';
		
		// TODO: Hardcoded at A4 and portrait
		pageHeight = pageFormats['a4'][1] / k;
		pageWidth = pageFormats['a4'][0] / k;
	}
	
	var out = function(string) {
		if(state == 2) {
			pages[page] += string + '\n';
		} else {
			buffer += string + '\n';
		}
	}

	// TODO: Escape text
	var pdfEscape = function(text) {
		return text;
	}
	
	return {
		init: function() {
			//Scale factor
			if (unit == 'pt') {
				k = 1;
			} else if(unit == 'mm') {
				k = 72/25.4;
			} else if(unit == 'cm') {
				k = 72/2.54;
			} else if(unit == 'in') {
				k = 72;
			}
		},
		addPage: function() {
			beginPage();
			// Set line width
			out(sprintf('%.2f w', (lineWidth * k)));
			
			// Set font - TODO
			out('BT /F1 16.00 Tf ET'); 
		},
		text: function(x, y, text) {
			// need page height
			var str = sprintf('BT %.2f %.2f Td (%s) Tj ET', x * k, (pageHeight - y) * k, pdfEscape(text));
			out(str);
		},
		addImage: function(imageData, format, x, y, w, h) {
		
		},
		close: function() {
			endDocument();
		},
		output: function() {
			endDocument();
			return buffer;
		}
	}

}();