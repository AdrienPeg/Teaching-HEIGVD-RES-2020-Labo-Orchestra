/*
 This program simulates a "data collection autidor", which joins a multicast
 group in order to receive instruments published by musican.
 The instrument are transported in json payloads with the following format:
   {"timestamp":1394656712850,"instrument":"kitchen"}
 Usage: to start the station, use the following command in a terminal
   node auditor.js
*/

/*
 * We have defined the multicast address and port in a file, that can be imported.
 * The address and the port are part of our simple
 * application-level protocol
 */
const protocol = require('./protocol');

/*
 * We use a standard Node.js module to work with UDP
 */
const dgram = require('dgram');

/*
* We need a map for the instruments and their sounds
 */
const instruments = new Map()
instruments.set("piano", "ti-ta-ti")
instruments.set("trumpet", "pouet")
instruments.set("flute", "trulu")
instruments.set("violin", "gzi-gzi")
instruments.set("drum", "boum-boum")

/*
 * Let's create a datagram socket. We will use it to listen for datagrams published in the
 * multicast group by musicans and containing instruments
 */
const s = dgram.createSocket('udp4');
s.bind(protocol.PROTOCOL_PORT_UDP, function() {
    console.log("Joining multicast group");
    s.addMembership(protocol.PROTOCOL_MULTICAST_ADDRESS);
});

/*
Map of all musicians
 */
let allMusicians = new Map();
/*
 * This call back is invoked when a new datagram has arrived.
 */
s.on('message', function(msg, source) {
    console.log("Data has arrived: " + msg + ". Source port: " + source.port);
    const jsonParsed = JSON.parse(msg);
    const uuidMusician = jsonParsed.uuid;
    // add musicians or update them
    allMusicians.set(uuidMusician, msg);
});

/*
Interval to check if musicians are inactive for more than 5 seconds
 
*/
/*
setInterval(() => {
    allMusicians.forEach((value, key)=>{
        if (Date.now() - value.activeSince.getTime() > 5000){
            allMusicians.delete(key);
        }
    });
}, 1000);
*/
/*
Creation server TCP
Write musicians
 */
const net = require('net');
const TCP_Server = net.createServer();

TCP_Server.on('listening', function(){
	console.log("Server listening for connection requests on port : " + protocol.PROTOCOL_PORT_TCP);
});

TCP_Server.on('connection', function(socket){
    let musicianList = [];
    allMusicians.forEach((value, key) => {
		if (moment(value.activeSince, "DD MM YYYY hh:mm:ss") >= moment().subtract(5, 'seconds')) {
            musicianList.push({uuid: key, instrument: value.instrument, activeSince: value.activeSince});
        } else { 
            allMusicians.delete(key);
        }
    });
	
	
    socket.write(JSON.stringify(musicianList, null, 2));
    socket.write("\n");
    socket.end();
});

TCP_Server.listen(protocol.PROTOCOL_PORT_TCP)
