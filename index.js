'use strict';

var TelegramBot = require('node-telegram-bot-api'),
    cbrRates = require('cbr-rates'),
    BN = require('bignumber.js');

var data = {};

function updateRates() {
    try {
        cbrRates().then(function (rates) {
            data = rates;
        });
    } catch(e) {
        console.error(e);
    }
}

updateRates();
setInterval(function() {
    updateRates();
}, 10000);

var token = '';

// Setup polling way
var bot = new TelegramBot(token, {polling: true});

bot.getMe().then(function (me) {
    console.log('Hi my name is %s!', me.username);
});

// cross rates
bot.onText(/\/([a-zA-Z]{6})(.+)?/, function (msg, match) {
    var clientId = msg.from.id;
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
    bot.sendMessage(clientId, message);
});

bot.onText(/\/list/, function (msg, match) {
    var clientId = msg.from.id;
    var message = 'В данный момент доступны курсы следующих валют: RUB, ';
    Object.keys(data).map(function(currency) {
       message += currency.toUpperCase() + ', '; 
    });
    message = message.substring(0, message.length-2);
    bot.sendMessage(clientId, message);
});

bot.onText(/\/start/, function (msg, match) {
    var clientId = msg.from.id;
    var message = 'Бот предоставляет информацию по текущему курсу ЦБ РФ для различных валют. Чтобы запросить курс введите /%валюта1%%валюта2%. Например /usdrub. Чтобы посмотреть доступный список валют отправьте /list.';
    bot.sendMessage(clientId, message);
});
