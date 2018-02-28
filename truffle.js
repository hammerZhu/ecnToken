require('babel-register');
require('babel-polyfill');

module.exports = {
    networks: {
        development: {
            host: 'localhost',
            port: 8545,
            network_id: '*' // Match any network id
        },
        /*live: {
            host: 'localhost',
            port: 8545,
            network_id: '*', // Match any network id
            from:"0x5654De7e1e61b0a49e288502bFA01bBA62918808"
        },
        */
        /*coverage: {
            host: "localhost",
            network_id: "*",
            port: 8555,
            gas: 0xfffffffffff,
            gasPrice: 0x01
        }*/
    },
    mocha: {
        useColors: true,
        slow: 30000,
        bail: true
    }
};
