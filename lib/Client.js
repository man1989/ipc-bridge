/**
 * Wrapper for Socket class
 */
const net = require("net");
const { EventEmitter } = require("events");
const util = require("./util");
const RETRY_AFTER = 1; //seconds
class Client extends EventEmitter {

    constructor() {
        super();
        this.socket = new net.Socket({
            readable: true,
            writable: true
        });
        this.bindEvents();
    }

    /**
     * Writes it to the client socket which will then recieved by the server socket
     * @param {String} topic 
     * @param {Object} payload 
     */
    write(topic, payload) {
        try {
            const wrappedData = util.wrap(topic, payload);
            this.socket.write(wrappedData);
        } catch (err) {
            console.warn(`${this._id}: unable to write data into the socket`);
        }
    }

    connect(...args) {
        this.socket.connect(...args);
    }

    bindEvents() {
        this.socket.on("connect", this.emit.bind(this, "connect"));
        /**
        * This listener will be invoked, once the data is available
        * to the client via server socket. Job of this listener is to
        * extract the buffer data and send it to it's subscribed topic.
        */
        this.socket.on("data", (result) => {
            result = result.toString();
            const dataList = util.unwrap(result);
            dataList.forEach((payload) => {
                this.emit("data", payload);
            });
        });

        /**
        * every client socket will try to reconnect once the server is closed/terminated
        */
        this.socket.on("close", () => {
            const _id = setTimeout(() => {
                this.emit("reconnect");
                clearTimeout(_id);
            }, RETRY_AFTER * 1000);
        });

        this.socket.on("error", (err) => {
            console.debug("error while connecting:", err);
        });
    }
}

module.exports = {
    create: function () {
        return new Client();
    }
}