/**
 * IPC Server
 */
const net = require("net");
const SocketManager = require("./SocketManager");
const lockfile = require("lockfile");
const MAX_CONNECTIONS = 10;

class Server {

    constructor() {
        this.socketManager = new SocketManager();
    }

    /**
     * creates IPC server
     * @param {Strng} socketPath 
     * @param {Function} cb 
     */
    createServer(socketPath, cb) {
        this.socketPath = socketPath;
        this.server = net.createServer().listen(socketPath, () => {
            cb();
        });
        this.isListening = this.server.listening;
        this.server.maxConnections = MAX_CONNECTIONS;
        this.bindEvents(cb);
    }

    bindEvents(cb) {
        this.server.on("connection", (socket) => {
            this.socketManager.add(socket);
            console.log(`new client has been connected to the bridge on ${new Date().toISOString()}`);
            console.log("total clients connected:", this.socketManager.getTotal());
        });

        this.server.on("error", (err) => {
            // cb only will be available during server creating time
            if (cb) {
                cb(err);
            }
            console.error("BRIDGE_SERVER_ERROR:", err);
            this.close();
        });

        this.server.on("close", () => {
            lockfile.unlock(`${this.socketPath}.lock`);
        });
    }

    close(cb) {
        this.socketManager.getAllSockets().forEach((s) => {
            s.destroy();
        });
        this.server.close(cb);
    }
}


module.exports = new Server();