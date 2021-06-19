var protocol = require('./musician-protocol');

var dgram = require('dgram');

const date = require('date-and-time');

const { v4: uuidv4 } = require('uuid');  

var s = dgram.createSocket('udp4');

if(process.argv[2] == null) {
	console.log("Please enter an instrument.")
	return
}

const instruments = new Map()

instruments.set("piano", "ti-ta-ti")
instruments.set("trumpet", "pouet")
instruments.set("flute", "trulu")
instruments.set("violin", "gzi-gzi")
instruments.set("drum", "boum-boum")

function Musician(instrument) {
	if(instruments.get(instrument) == undefined){
		console.log("Please enter a valid instrument");
		return;
	}
	
	const now = new Date();
	date.format(now, 'YYYY/MM/DD HH:mm:ss')
	
	this.uuid = uuidv4();
	
	Musician.prototype.update = function () {
		
		var payload = JSON.stringify({
			uuid: this.uuid,
			sound: instruments.get(instrument),
			activeSince: now
		});
		
		message = new Buffer(payload);
		s.send(message, 0, message.length, protocol.PROTOCOL_PORT, protocol.PROTOCOL_MULTICAST_ADDRESS, function(err, bytes) {
			console.log("Sending payload: " + payload + " via port " + s.address().port);
		});
	}
	
	setInterval(this.update.bind(this), 1000);
	
}
		
		
