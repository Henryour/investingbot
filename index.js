'use strict';

var TelegramBot = require('node-telegram-bot-api'),
    cbrRates = require('cbr-rates'),
    BN = require('bignumber.js');

var data = {};

function updateRates() {
    cbrRates().then(function(rates) {
        data = rates;
    });
}

updateRates();
setInterval(function() {
    updateRates();
}, 10000);

var token = '';

// Setup polling way
var bot = new TelegramBot(token, {polling: true});

// cross rates
bot.onText(/\/([a-zA-Z]{6})(.+)?/, function (msg, match) {
    var fromId = msg.from.id;
    var curr = match[1],
        message = '';
    var currencyOne = curr.substr(0, 3),
        currencyTwo = curr.substr(3, 3);
    message = currencyOne + '/' + currencyTwo;
    if( ('undefined' == typeof(data[currencyOne]) && currencyOne != 'rub') || ('undefined' == typeof(data[currencyTwo]) && currencyTwo != 'rub')) {
        message = 'В данный момент данные недоступны. Проверьте корректность указанного символа или повторите команду позднее.'
    } else {
        var val1 = currencyOne == 'rub' ? 1 : data[currencyOne]['value'],
            val2 = currencyTwo == 'rub' ? 1 : data[currencyTwo]['value'];
        message = 'Текущий курс ' + (currencyOne + '/' + currencyTwo).toUpperCase() + ' по Центробанку РФ: ' + (new BN((new BN(val1)).div(new BN(val2)).toFixed(4))).toString();
    }
    bot.sendMessage(fromId, message);
});
