# Teaching-HEIGVD-RES-2020-Labo-Orchestra

## Admin

* **You can work in groups of 2 students**.
* It is up to you if you want to fork this repo, or if you prefer to work in a private repo. However, you have to **use exactly the same directory structure for the validation procedure to work**. 
* We expect that you will have more issues and questions than with other labs (because we have a left some questions open on purpose). Please ask your questions on Telegram / Teams, so that everyone in the class can benefit from the discussion.

## Objectives

This lab has 4 objectives:

* The first objective is to **design and implement a simple application protocol on top of UDP**. It will be very similar to the protocol presented during the lecture (where thermometers were publishing temperature events in a multicast group and where a station was listening for these events).

* The second objective is to get familiar with several tools from **the JavaScript ecosystem**. You will implement two simple **Node.js** applications. You will also have to search for and use a couple of **npm modules** (i.e. third-party libraries).

* The third objective is to continue practicing with **Docker**. You will have to create 2 Docker images (they will be very similar to the images presented in class). You will then have to run multiple containers based on these images.

* Last but not least, the fourth objective is to **work with a bit less upfront guidance**, as compared with previous labs. This time, we do not provide a complete webcast to get you started, because we want you to search for information (this is a very important skill that we will increasingly train). Don't worry, we have prepared a fairly detailed list of tasks that will put you on the right track. If you feel a bit overwhelmed at the beginning, make sure to read this document carefully and to find answers to the questions asked in the tables. You will see that the whole thing will become more and more approachable.


## Requirements

In this lab, you will **write 2 small NodeJS applications** and **package them in Docker images**:

* the first app, **Musician**, simulates someone who plays an instrument in an orchestra. When the app is started, it is assigned an instrument (piano, flute, etc.). As long as it is running, every second it will emit a sound (well... simulate the emission of a sound: we are talking about a communication protocol). Of course, the sound depends on the instrument.

* the second app, **Auditor**, simulates someone who listens to the orchestra. This application has two responsibilities. Firstly, it must listen to Musicians and keep track of **active** musicians. A musician is active if it has played a sound during the last 5 seconds. Secondly, it must make this information available to you. Concretely, this means that it should implement a very simple TCP-based protocol.

![image](images/joke.jpg)


### Instruments and sounds

The following table gives you the mapping between instruments and sounds. Please **use exactly the same string values** in your code, so that validation procedures can work.

| Instrument | Sound         |
|------------|---------------|
| `piano`    | `ti-ta-ti`    |
| `trumpet`  | `pouet`       |
| `flute`    | `trulu`       |
| `violin`   | `gzi-gzi`     |
| `drum`     | `boum-boum`   |

### TCP-based protocol to be implemented by the Auditor application

* The auditor should include a TCP server and accept connection requests on port 2205.
* After accepting a connection request, the auditor must send a JSON payload containing the list of <u>active</u> musicians, with the following format (it can be a single line, without indentation):

```
[
  {
  	"uuid" : "aa7d8cb3-a15f-4f06-a0eb-b8feb6244a60",
  	"instrument" : "piano",
  	"activeSince" : "2016-04-27T05:20:50.731Z"
  },
  {
  	"uuid" : "06dbcbeb-c4c8-49ed-ac2a-cd8716cbf2d3",
  	"instrument" : "flute",
  	"activeSince" : "2016-04-27T05:39:03.211Z"
  }
]
```

### What you should be able to do at the end of the lab


You should be able to start an **Auditor** container with the following command:

```
$ docker run -d -p 2205:2205 res/auditor
```

You should be able to connect to your **Auditor** container over TCP and see that there is no active musician.

```
$ telnet IP_ADDRESS_THAT_DEPENDS_ON_YOUR_SETUP 2205
[]
```

You should then be able to start a first **Musician** container with the following command:

```
$ docker run -d res/musician piano
```

After this, you should be able to verify two points. Firstly, if you connect to the TCP interface of your **Auditor** container, you should see that there is now one active musician (you should receive a JSON array with a single element). Secondly, you should be able to use `tcpdump` to monitor the UDP datagrams generated by the **Musician** container.

You should then be able to kill the **Musician** container, wait 5 seconds and connect to the TCP interface of the **Auditor** container. You should see that there is now no active musician (empty array).

You should then be able to start several **Musician** containers with the following commands:

```
$ docker run -d res/musician piano
$ docker run -d res/musician flute
$ docker run -d res/musician flute
$ docker run -d res/musician drum
```
When you connect to the TCP interface of the **Auditor**, you should receive an array of musicians that corresponds to your commands. You should also use `tcpdump` to monitor the UDP trafic in your system.


## Task 1: design the application architecture and protocols

| #  | Topic |
| --- | --- |
|Question | How can we represent the system in an **architecture diagram**, which gives information both about the Docker containers, the communication protocols and the commands? |
| | ![diagram](images\diagram.png) |
|Question | Who is going to **send UDP datagrams** and **when**? |
| | Each musician will send an UDP datagram every second. |
|Question | Who is going to **listen for UDP datagrams** and what should happen when a datagram is received? |
| | The Auditor is going to listen to the datagrams. When the datagram is received, the auditor must add the musician that sent the datagram to its list of musicians. If the musicians is already in the list, its last play time has to be changed. The auditors will kick the musicians if he didn't play for the last five seconds. |
|Question | What **payload** should we put in the UDP datagrams? |
| | The payload must contain a list of musician. For each musician, his instrument, uuid and the time when he started playing must be specified. |
|Question | What **data structures** do we need in the UDP sender and receiver? When will we update these data structures? When will we query these data structures? |
| | Senders and receivers need a map with the instruments and their sounds. Receiver need an array with all the musicians. We update the array when : <br />- Receiver receive a new datagram of a musician <br />- Receiver receive a datagram a musician that the last play time has changed. <br />- When a musician hasn't played for 5 seconds, we remove it from the array. We will query the array when we ask the auditor who's playing from the host. |


## Task 2: implement a "musician" Node.js application

| #  | Topic |
| ---  | --- |
|Question | In a JavaScript program, if we have an object, how can we **serialize it in JSON**? |
| | with the following command : `JSON.stringify(object)` |
|Question | What is **npm**?  |
| | npm is the package manager for the Node JavaScript platform. It is **used** to publish, discover, install, and develop node programs. <br />Source : https://docs.npmjs.com/cli/v6/commands/npm |
|Question | What is the `npm install` command and what is the purpose of the `--save` flag?  |
| | `npm install` installs a package and any package that it depends on. Before npm 5, the --save flag was mandatory to add the package to `package.json`. On more recent versions, it is now done automatically. |
|Question | How can we use the `https://www.npmjs.com/` web site?  |
| | This website can be used to look for packages. There are also explanations on how to install and use every packages available. |
|Question | In JavaScript, how can we **generate a UUID** compliant with RFC4122? |
| | With the [uuid](https://www.npmjs.com/package/uuid) package. Once it is installed with the command `npm install uuid`, it can be used with these lines : <br />`const { v4: uuidv4 } = require('uuid');` <br /> `var uuid = uuidv4();` |
|Question | In Node.js, how can we execute a function on a **periodic** basis? |
| | With the function `setInterval(function, interval)`with `function`bein the function to execute and `interval` the number of milliseconds before executing `function` again. |
|Question | In Node.js, how can we **emit UDP datagrams**? |
| | With the module `dgram`. First it must be initialized with the following lines : <br />`var dgram = require('dgram');` <br />`var s = dgram.createSocket('udp4');` <br />Then the socket can be used to send an UDP datagram on the desired address and port : <br /> `socket.send(msg[, offset, length][, port][, address][, callback])` |
|Question | In Node.js, how can we **access the command line arguments**? |
| | With `process.argv[N]`. If N = 0, it will return `Node`and if N = 1, it will return the name of the file. |


## Task 3: package the "musician" app in a Docker image

| #  | Topic |
| ---  | --- |
|Question | How do we **define and build our own Docker image**?|
| | With the command `docker build -t imageName .`this command must be run in the directory where the corresponding Dockerfile is stored. |
|Question | How can we use the `ENTRYPOINT` statement in our Dockerfile?  |
| | *Enter your response here...*  |
|Question | After building our Docker image, how do we use it to **run containers**?  |
| | Once the image has been built, use the following command : `docker run [OPTIONS] IMAGE [COMMAND] [ARG...]`. A list of options can be found here : |
|Question | How do we get the list of all **running containers**?  |
| | With the command `docker ps` |
|Question | How do we **stop/kill** one running container?  |
| | Kill : `docker kill [OPTIONS] CONTAINER [CONTAINER...]`<br />Stop : `docker stop [OPTIONS] CONTAINER [CONTAINER...]` |
|Question | How can we check that our running containers are effectively sending UDP datagrams?  |
| | By looking at the logs of the running containers with the command `docker logs containerId` |


## Task 4: implement an "auditor" Node.js application

| #  | Topic |
| ---  | ---  |
|Question | With Node.js, how can we listen for UDP datagrams in a multicast group? |
| | We can add the IP source for multicast to the membership of de socket with its function addMembership(<IP multicast>) |
|Question | How can we use the `Map` built-in object introduced in ECMAScript 6 to implement a **dictionary**?  |
| | We can use new Map() to crate a map. <br />We add the key and the value with set(key,value) function.<br />We get the value of a key with get(key) function. <br />We change the value of a key with get(key).push("newValue"). <br />We can delete a key with delete(key) function. <br />We can check if there is a key with has(key) function. |
|Question | How can we use the `Moment.js` npm module to help us with **date manipulations** and formatting?  |
| | We can use the function moment(<number>, <format of time of the musician>).fromNow() And we can use it to see if the play is inactive since more than 5 seconds. |
|Question | When and how do we **get rid of inactive players**?  |
| | When there is a new connection to the TCP server, every musician will be checked to see if they have been active during the last 5 seconds. If it is not the case, they are removed from the musician list. |
|Question | How do I implement a **simple TCP server** in Node.js?  |
| | Sorry to almost copy past, put I don't how to explain it better.<br />Source : https://riptutorial.com/node-js/example/22405/a-simple-tcp-server <br />- We require Nodejs net module.<br/>const Net = require('net');<br/>- We have the port it listen to.<br/>const port = <PORT>;<br/>- The server listens to a socket for a client to make a connection request.<br/>server.listen(port, function() {<br/>    console.log(`Server listening for connection requests on socket localhost:${port}`.);<br/>});<br/>When a client requests a connection with the server, the server creates a new<br/>socket dedicated to that client.<br/>server.on('connection', function(socket) {<br/>    console.log('A new connection has been established.');<br/><br/>    // Now that a TCP connection has been established, the server can send data to<br/>    // the client by writing to its socket.<br/>    socket.write('Hello, client.');<br/><br/>    // The server can also receive data from the client by reading from its socket.<br/>    socket.on('data', function(chunk) {<br/>        console.log(`Data received from client: ${chunk.toString()`.});<br/>    });<br/><br/>    // When the client requests to end the TCP connection with the server, the server<br/>    // ends the connection.<br/>    socket.on('end', function() {<br/>        console.log('Closing connection with the client');<br/>    });<br/><br/>    // Don't forget to catch error, for your own sake.<br/>    socket.on('error', function(err) {<br/>        console.log(`Error: ${err}`);<br/>    });<br/>}); |


## Task 5: package the "auditor" app in a Docker image

| #  | Topic |
| ---  | --- |
|Question | How do we validate that the whole system works, once we have built our Docker image? |
| | -We need to test that building the images of auditors and musicians with their instruments works.<br/>-We need to see if the tcp connection works between the auditor and the host work.<br/>it works if the host recieve something.<br/>-We need to see if the number data received is the number of musicians that played the last five seconds.<br />- The script validate.sh can also be used.<br /> |


## Constraints

Please be careful to adhere to the specifications in this document, and in particular

* the Docker image names
* the names of instruments and their sounds
* the TCP PORT number

Also, we have prepared two directories, where you should place your two `Dockerfile` with their dependent files.

Have a look at the `validate.sh` script located in the top-level directory. This script automates part of the validation process for your implementation (it will gradually be expanded with additional operations and assertions). As soon as you start creating your Docker images (i.e. creating your Dockerfiles), you should try to run it.
