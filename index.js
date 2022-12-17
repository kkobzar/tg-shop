require('dotenv').config();
const { Telegraf, Markup} = require('telegraf');
const menu = require('./menu');

const bot = new Telegraf(process.env.BOT_TOKEN);

const storage = {};

const homeBnt = Markup.button.callback('🏡 Главная', 'main')

/*
*
* ---CITY MENU
*
* */

let citiesMenuArr = []

if (menu.cities){
    for (let city in menu.cities){
        if(menu.cities[city].title){
            citiesMenuArr.push([Markup.button.callback(menu.cities[city].title, city)])
        }else {
            citiesMenuArr.push([Markup.button.callback('No title', city)])
        }
    }
}

const cityMenu = Markup.inlineKeyboard(citiesMenuArr)


//get Products in city
const getProducts = (city = '') => {
    if (!city)
        return false;

    let productMenuArr = []

    if (menu.products){
        for (let cty in menu.products){
            //if city index is same as param get all products
            if (cty === city){
                for (let prod in menu.products[cty]){
                    // check if product name is provided
                    if (menu.products[cty][prod].title === undefined){
                        productMenuArr.push([Markup.button.callback('🔞🥶🥵', prod)])
                    }else {
                        productMenuArr.push([Markup.button.callback(menu.products[cty][prod].title, prod)])
                    }
                }
            }
        }
    }

    if (productMenuArr.length){
        productMenuArr.push([homeBnt])
        return productMenuArr
    }else {
        return false
    }
}

const showProductMenu = (ctx,mnu)=>{
    //ctx.deleteMessage()
    if (mnu){
        ctx.reply('Выбирай:',Markup.inlineKeyboard(mnu))
    }else {
        ctx.reply('К сожалению в данном регионе нихуя нэма 😢', Markup.inlineKeyboard([homeBnt]))
    }
}

const showMainMenu = (ctx)=>{
    ctx.reply(`Приветствуем в нашем боте!\nДля начала укажите ваш город:`,cityMenu)
}

//--- City available products bind
for (let cty in menu.cities){
    let menu = getProducts(cty)
    bot.action(cty,ctx=>{
        storage[ctx.chat.id] = {city:cty}
        //store(ctx.chat.id,{city:cty})
        showProductMenu(ctx,menu)
    })
}


//---HOME BUTTON
bot.action('main', (ctx) => {
    storage[ctx.chat.id] = false;
    //store(ctx.chat.id,false)
    showMainMenu(ctx)
});
bot.start(showMainMenu);

bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
