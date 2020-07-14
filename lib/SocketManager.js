/**
 * Manages server sockets
 */
let sockets = [];

class SocketManager {

    /**
     * add the server socket to active socket list
     * @param {Socket} socket 
     */
    add(socket) {
        socket._id = Symbol("id");
        sockets.push(socket);
        this.bindEvents(socket);
    }

    /**
     * remove sockets which are no longer active
     */
    removeZombies() {
        sockets = sockets.filter((s) => {
            return !s.destroyed
        });
    }

    getAllSockets() {
        return sockets;
    }

    getTotal() {
        return sockets.length;
    }

    bindEvents(socket) {
        socket.on("data", (chunk) => {
            if (chunk) {
                this.broadcast(socket, chunk);
            }
        });

        socket.on("close", () => {
            console.log("client has closed the connection");
            this.removeZombies();
            console.log(`total clients: ${this.getTotal()}`);
        });

        socket.on("drain", () => {
            console.log("buffer is emptied");
        });
    }

    /**
     * broadcast the data to clients execpt to its own
     * @param {Socket} socket 
     * @param {Object} data 
     */
    broadcast(socket, data) {
        sockets.forEach((s) => {
            if (s._id !== socket._id) {
                s.write(data);
            }
        });
    }
}

module.exports = SocketManager;
