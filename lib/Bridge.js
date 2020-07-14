/**
* creates IPC via unix socket
*/

const util = require("./util");
const lockfile = util.promisifyAll(require("lockfile"));
const { EventEmitter } = require("events");
const server = require("./server");
const Client = require("./Client");
const unlinkAsync = util.promisify(require("fs").unlink);
const SOCKET_NAME = 'xx_bridge_xx.sock';
const SOCKET_DIR_PATH = process.env.DATA_DIR || "/tmp";

const privateData = {
    socketFilePath: `${SOCKET_DIR_PATH}/${SOCKET_NAME}`,
    lockFilePath: `${SOCKET_DIR_PATH}/${SOCKET_NAME}.lock`,
    normalizeFilePaths(socketFilePath) {
        this.socketFilePath = socketFilePath || this.socketFilePath;
        this.lockFilePath = `${this.socketFilePath}.lock`;
    },
    getSocketFilePath() {
        return this.socketFilePath;
    },
    /**
    * wrapper function for unlinkAsync which ignores the error
    */
    deleteSocketFile() {
        const noop = function () { };
        return unlinkAsync(this.socketFilePath).then(noop, noop);
    },
    getLockFilePath() {
        return this.lockFilePath;
    }
};

class Bridge extends EventEmitter {
    constructor(socketPath) {
        super();
        this.totalReconnects = 0
        privateData.normalizeFilePaths(socketPath);
        console.debug("Private Data:", privateData);
        this.connect();
    }
    /**
     *  this methods ensures that only one of the caller will be able to create the server
     *  by means of locking and also for the same server it creates a client
     *  which then will be connected to the server.
     *  Incase if lock is aquired, it will just create a client and will get connected
     *  to the existing server.
     */
    connect() {
        const socketFilePath = privateData.getSocketFilePath();
        const lockFilePath = privateData.getLockFilePath();
        this.client = Client.create();
        this.bindEvents();
        const createServer = util.promisify(server.createServer.bind(server));
        const _connect = (err) => {
            if (!err) {
                console.log(`server has started on date: ${new Date().toISOString()}`);
                console.debug('Server using socket file @path:', socketFilePath);
                this.client.connect({ path: socketFilePath });
            } else if (err && err.code === "EEXIST" && err.path === lockFilePath) {
                console.debug("Lock already exists, creating client:", socketFilePath);
                this.client.connect({ path: socketFilePath });
            } else if (err) {
                console.error("bridge connection failed:", err);
            }
        }

        lockfile.lockAsync(lockFilePath, {}).then(() => {
            console.debug("aquired lock:", lockFilePath);
            return privateData.deleteSocketFile();
        }).then(() => {
            return createServer(socketFilePath);
        }).then(_connect, _connect);

    }

    bindEvents() {
        this.client.on("connect", this.emit.bind(this, "connect"));

        this.client.on("data", (payload) => {
            const { topic, data } = payload;
            this.emit(topic, data);
        });

        this.client.on("reconnect", () => {
            this.reconnect();
        });
    }

    /**
     * register event handler for a topic
     * @param {String} topic 
     * @param {Function} cb
     */
    subscribe(topic, cb) {
        this.addListener(topic, cb);
    }

    /**
     * It will publish the data to other connected clients 
     * @param {String} topic 
     * @param {Object} payload 
     */
    publish(topic, payload) {
        this.client.write(topic, payload);
    }

    /**
     * incase server dies, other running socket clients will race to become a server
     */
    reconnect() {
        ++this.totalReconnects;
        console.debug("Trying to reconnect times:", this.totalReconnects);
        this.connect();
    }

    /**
    * utility method to create instance of Bridge class.
    * @param {String} socketPath
    * Note:- this is mostly for backward compatiblity,
    * for newer implementation use class constuctor
    */
    static connect(socketPath) {
        return new Bridge(socketPath);
    }
}

module.exports = Bridge;