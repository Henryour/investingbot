'use strict';

var TelegramBot = require('node-telegram-bot-api'),
    cbrRates = require('cbr-rates'),
    Micex = require('micex.api'),
    BN = require('bignumber.js');

var data = {},
    dataTom ={};

function updateRates() {
    try {
        cbrRates().then(function (rates) {
            data = rates;
        });
    } catch(e) {
        console.error(e);
    }
    Micex.securityMarketdata('USD000UTSTOM')
        .then(function (security){
            dataTom['usd'] = security.node.last;
        });

    Micex.securityMarketdata('EUR_RUB__TOM')
        .then(function (security){
            dataTom['eur'] = security.node.last;
        });
}

updateRates();
setInterval(function() {
    updateRates();
}, 10000);

var token = '1217766502:AAHEshc_PTgIuENAZsxgB-cSojvDNMmyFEU';

// Setup polling way
var bot = new TelegramBot(token, {polling: true});

bot.getMe().then(function (me) {
    console.log('Hi my name is %s!', me.username);
});

// cross rates
bot.onText(/\/([a-zA-Z]{6})$/, function (msg, match) {
    var clientId = msg.from.id,
        chatId = msg.chat.id;
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
    bot.sendMessage(chatId, message);
});

// inidcator rates

bot.onText(/\/([a-zA-Z]{6})(tom)/, function (msg, match) {
    var clientId = msg.from.id,
        chatId = msg.chat.id;
    var curr = match[1],
        message = '';
    switch(true) {
        case(curr == 'usdrub' && 'undefined' != typeof(dataTom['usd'])):
            message = 'Текущий прогноз USD/RUB на завтрашний день на основе торговли контрактами на Московской бирже: ' + dataTom['usd'];
            break;
        case(curr == 'eurrub' && 'undefined' != typeof(dataTom['eur'])):
            message = 'Текущий прогноз EUR/RUB на завтрашний день на основе торговли контрактами на Московской бирже: ' + dataTom['eur'];
            break;
        case(curr == 'eurusd' && 'undefined' != typeof(dataTom['usd']) && 'undefined' != typeof(dataTom['eur'])):
            message = 'Текущий прогноз EUR/USD на завтрашний день на основе торговли контрактами на Московской бирже: ' + (new BN((new BN(dataTom['eur'])).div(new BN(dataTom['usd'])).toFixed(4))).toString();
            break;
        case(curr == 'usdeur' && 'undefined' != typeof(dataTom['usd']) && 'undefined' != typeof(dataTom['eur'])):
            message = 'Текущий прогноз USD/EUR на завтрашний день на основе торговли контрактами на Московской бирже: ' + (new BN((new BN(dataTom['usd'])).div(new BN(dataTom['eur'])).toFixed(4))).toString();
            break;
        default:
            message = 'В данный момент данные недоступны. Проверьте корректность указанного символа или повторите команду позднее.'
    }
    bot.sendMessage(chatId, message);
});

bot.onText(/\/list/, function (msg, match) {
    var clientId = msg.from.id,
        chatId = msg.chat.id;
    var message = 'В данный момент доступны текущие курсы следующих валют: RUB, ';
    Object.keys(data).map(function(currency) {
       message += currency.toUpperCase() + ', '; 
    });
    message = message.substring(0, message.length-2);
    message += '. Прогнозирующие крусы доступны для валют: RUB, USD, EUR.';
    bot.sendMessage(chatId, message);
});

bot.onText(/\/(start|help)/, function (msg, match) {
    var clientId = msg.from.id,
        chatId = msg.chat.id;
    var message = 'Бот предоставляет информацию по текущему курсу ЦБ РФ для различных валют. ' +
        'Чтобы запросить курс отправьте /%валюта1%%валюта2%. Например /usdrub. ' +
        'Чтобы запросить прогноз на основе контрактов отправьте /%валюта1%%валюта2%tom. Например /usdrubtom. ' +
        'Чтобы посмотреть доступный список валют отправьте /list.';
    bot.sendMessage(chatId, message);
});
