# ipc-bridge
communicate between multiple processes via publisher subscriber mechanism.

### Prerequisites
you need to have node version 6 and above

### Dependecies

```
lockfile v1.0.3
```

### How it Works?

out of multiple clients, one of the clients will create the the server and rest of the clients will join the server. Any client process can communicate with any other process via events. In case server process gets terminated then in one of the client process will try to create the server which depends on which client has aquired the lock first. Once the "old" server process comes back online it will join it as a client process and not the server process.

##### proc1 (server);
```javascript
const Bridge = require("ipc-bridge");
let socketPath = "/tmp/mysocket.sock";
const bridge = new Bridge(socketPath) //in v1.0.0 Bridge.connect(socketPath)
bridge.subscribe("comic-con-day", (data)=>{
    //prints `Welcome the day`
    console.log(data)
    bridge.publish("superhero", "Batman");
})
```
##### proc2 (client 1)
```javascript
const Bridge = require("ipc-bridge");
let socketPath = "/tmp/mysocket.sock";
const bridge = new Bridge(socketPath) //in v1.0.0 Bridge.connect(socketPath);

bridge.subscribe("superhero", (data)=>{
    //prints `I am Batman`
    //prints `I am Superman`
    console.log(`I am ${data}`);
    bridge.publish("comic-con-day", "Welcome the day");
});
```
##### proc3 (client 2)
```javascript
const Bridge = require("ipc-bridge");
let socketPath = "/tmp/mysocket.sock";
const bridge = new Bridge(socketPath) //in v1.0.0 Bridge.connect(socketPath);

bridge.subscribe("comic-con-day", (data)=>{
    //prints `Welcome the day`
    console.log(data)
    bridge.publish("superhero", "superman");
});
```