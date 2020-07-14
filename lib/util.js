/**
 * utiliy module with helper functions
 */
"use strict";
function _wrap(topic, data) {
    data = JSON.stringify({
        topic: topic,
        data: data
    });
    return `${data}\r\n`;
}

function _unwrap(data) {
    return data.split("\r\n").filter(x => x).map((d) => {
        return JSON.parse(d);
    });
}

/**
 * converts error first callback into promise
 * @param {Function} fn 
 */
function promisify(fn) {
    return function (...args) {
        return new Promise((resolve, reject) => {
            fn(...args, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            })
        });
    }
}

/**
 * it promisifies the callback methods and adds those method back to the module by appending
 * `Async` in the original method name
 * e.g:- `
 * module = {
 *     get: function(arg1, cb);
 * }
 * let module = promisifyAll(module)
 * (module.getAsync(arg1) instanceof Promise) === true
 * `
 * @param {Object} module 
 */
function promisifyAll(module) {
    Object.getOwnPropertyNames(module).forEach((fnName) => {
        if (typeof module[fnName] === "function") {
            module[`${fnName}Async`] = promisify(module[fnName]);
        }
    });
    return module;
}

module.exports = {
    wrap: _wrap,
    unwrap: _unwrap,
    promisify: promisify,
    promisifyAll: promisifyAll
};
