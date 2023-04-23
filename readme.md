# ipc-bridge
communicate between multiple processes via publisher subscriber mechanism.

### Prerequisites
you need to have node version 6 and above

### Dependecies

```
lockfile v1.0.3
```

### How it Works?

out of multiple clients, one of the clients will create the the server and rest of the clients will join the server. Any client process can communicate with any other process via events. In case of server process gets terminated then one of the other client process will try to create the server which depends on which client has aquired the lock first. Once the "old" server process comes back online it will join it as a client process and not the server process.

##### proc1 (client 1);
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
##### proc2 (client 2)
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
##### proc3 (client 3)
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
In the above example lets say `client 1` was the first one to boot up then `client 2` and `client 3` will join the bridge as clients and `client 1` will become server. After sometime if `client 1` leaves the bridge then one of the clent 2/client3 will become the server. Lets say `client 3` has acquired the lock first then `client 3` will become the server and `client 2` will join it as a client. After sometime `client 1` joins back then it will join the bridge as client.
