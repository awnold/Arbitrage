const axios = require('axios');
const tickers = ["ETH", "BTC", "GRT"];
const refreshRate = 10;

async function getCoinbasePrice(symbol) {
    var output;
    await axios.get("https://api.coinbase.com/v2/prices/" + symbol + "-USD/spot").then(response => {
        var obj = {
            symbol: symbol,
            price: response.data.data.amount
        }
        output = obj;
    })
    return output;
}

async function getBinancePrice(symbol) {
    var output;
    await axios.get("https://api.binance.com/api/v3/ticker/price?symbol=" + symbol + "USDT").then(response => {
        var obj = {
            symbol: symbol,
            price: response.data.price
        }
        output = obj;
    })
    return output;
}

async function checkDifference() {
    for (var i=0; i<tickers.length; i++) {
        var coinbaseData = await getCoinbasePrice(tickers[i]);
        var binanceData = await getBinancePrice(tickers[i]);
        var cbPrice = Number(coinbaseData.price);
        var bnPrice = Number(binanceData.price);
        var priceDiff = Math.abs(cbPrice-bnPrice);
        if (cbPrice > bnPrice) {
            var minDiff = cbPrice * 0.001;
            if (priceDiff >= minDiff) {
                console.log("Arbitrage Found: ", coinbaseData, binanceData);
            }
        } else if (bnPrice > cbPrice) {
            var minDiff = bnPrice * 0.001;
            if (priceDiff >= minDiff) {
                console.log("Arbitrage Found: ", coinbaseData, binanceData);
            }
        }
    }
}

async function start() {
    setInterval(()=>{
        checkDifference();
    },(refreshRate * 1000));
}

start();