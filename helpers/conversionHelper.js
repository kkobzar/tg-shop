//import fetch from "node-fetch";
//const fetch = require('node-fetch')
const https = require('https');
const rate = 9.245211206396523e-7;
const rub2btc = (rub = 0)=>{
    if (rub === 0)
        return 0

    return new Promise((resolve, reject)=>{
        resolve((rate*rub).toFixed(8));
        return;
        https.request({
            "method": "GET",
            "hostname": "rest.coinapi.io",
            "path": "/v1/exchangerate/RUB/BTC",
            "headers":{
                'X-CoinAPI-Key': process.env.API_TOKEN
            }
        },res => {
            let data = [];
            res.on("data", (chunk) => {
                data.push(chunk);
                console.log(chunk)
            });
            res.on('end', () => {
                console.log(JSON.parse(Buffer.concat(data).toString()));
                const result = JSON.parse(Buffer.concat(data).toString());
                resolve((result.rate*rub).toFixed(8));
            });
        }).on('error', err => {
            resolve((rate*rub).toFixed(8))
            console.log('Error: ', err.message);
            reject(err.message);
        })
    })
}
const conv = {
    rub2btc
}
module.exports = conv
