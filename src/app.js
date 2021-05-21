require('dotenv').config();
const { Client, Message } = require('discord.js');
const client = new Client();
const axios = require('axios');
const tickers = ["BTC", "ETH", "LTC", "ADA", "LINK", "XLM", "MATIC", "AAVE", "1INCH", "GRT"];
const refreshRate = 10;
const prefix = "$arb"
var arbType;

client.on('ready', () => {
    console.log(`${client.user.username} has logged in.`);
});

client.on('message', async message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;
	const args = message.content.slice(prefix.length).trim().split(' ');
	const command = args.shift().toLowerCase();
    if (args.length!=0 || !(command === 'big' || command === 'small' || command === 'b' || command === 's')) {
        message.channel.send("***Invalid Argument(s)!*** *Please use: 'big' or 'small'*");
        return;
    }
    if (command === 'big' || command === 'b') arbType = 0.02;
    if (command === 'small' || command === 's') arbType = 0.002;
    
    message.channel.send("*Please wait while I find current arbitrages between Coinbase and Binance...*");
    try {
        const tickerData = await checkDifference();
        var appendString = '';
        if (tickerData.length === 0) {
            appendString+=`:x: No significant arbitrages found at this time. **(>${arbType * 100}%)**`
            client.user.lastMessage.delete();
            message.channel.send(appendString);
            return;
        }
        for (var i=0; i<tickerData.length;i++) {
            var data = tickerData[i];
            appendString+=`:white_check_mark: **[${data.ticker}] Price Arbitrage:**\nCoinbase: *$${data.cbPrice}* \nBinance: *$${data.bnPrice}* \nDifference: *$${data.priceDiff}* \n**(${data.percentDiff}%)**\n\n`;
        }
        client.user.lastMessage.delete();
        message.channel.send(appendString);
    } catch (error) {
        client.user.lastMessage.delete();
        message.channel.send('Ran into an error finding an arbitrage.');
    }
});

client.login(process.env.ARBITRAGE_BOT_TOKEN);

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
    var arrayOfData = [];
    for (var i=0; i<tickers.length; i++) {
        var coinbaseData = await getCoinbasePrice(tickers[i]);
        var binanceData = await getBinancePrice(tickers[i]);
        var cbPrice = Number(coinbaseData.price);
        var bnPrice = Number(binanceData.price);
        var priceDiff = Math.abs(cbPrice-bnPrice);
        if (cbPrice > bnPrice) {
            var minDiff = cbPrice * arbType;
            if (priceDiff >= minDiff) {
                let ticker = {
                    ticker: tickers[i],
                    cbPrice: cbPrice,
                    bnPrice: bnPrice,
                    priceDiff: priceDiff.toFixed(4),
                    percentDiff: (priceDiff / cbPrice * 100).toFixed(2)
                }
                arrayOfData.push(ticker);

            }
        } else if (bnPrice > cbPrice) {
            var minDiff = bnPrice * arbType;
            if (priceDiff >= minDiff) {
                let ticker = {
                    ticker: tickers[i],
                    cbPrice: cbPrice,
                    bnPrice: bnPrice,
                    priceDiff: priceDiff.toFixed(4),
                    percentDiff: (priceDiff / bnPrice * 100).toFixed(2)
                }
                arrayOfData.push(ticker);
            } else {
                continue;
            }
        }
    }
    return arrayOfData;
}

async function start() {
    setInterval(()=>{
        checkDifference();
    },(refreshRate * 1000));
}

start();