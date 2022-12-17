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


//---get all products list
let productList = []
for (let cty in menu.products){
    if (!Object.entries(menu.products[cty]).length){
        continue;
    }
    for(let prod in menu.products[cty]){
        if (!productList.includes(prod)){
            productList.push(prod)
        }
    }
}

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

//---Get product available areas
const getProductArea = (city = '', product = '',ctx=null)=>{
    if (!city || !product || ctx === null)
        return false

    let areasBtn = []
    //get available areas for product
    if (product.areas.length && menu.cities[storage[ctx.chat.id].city]){
        for (let area of product.areas){
            let name = menu.cities[storage[ctx.chat.id].city].districts.find(i=>i.key === area)
            //console.log(name)
            areasBtn.push([Markup.button.callback(name.title,name.key)])
        }
    }

    if (areasBtn.length){
        areasBtn.push([homeBnt])
        return areasBtn
    }else {
        return false
    }
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

//---Get product info
const getProductInfo = (city = '', product = '')=> {
    if (!city || !product)
        return false

    let foundProduct = false
    if (menu.products){
        for (let cty in menu.products){
            if(cty === city){
                for (let prd in menu.products[cty]){
                    if (product === prd){
                        foundProduct = menu.products[cty][prd]
                    }
                }
            }
        }
    }

    return foundProduct
}

//--- Products order bind

for (let prod of productList){
    bot.action(prod,ctx=>{
        if (storage[ctx.chat.id] && storage[ctx.chat.id].city){
            const product = getProductInfo(storage[ctx.chat.id].city,prod)
            if (product){
                //save product to local storage
                storage[ctx.chat.id].product =prod
                //get areas
                const areaButtons = getProductArea(storage[ctx.chat.id].city,product,ctx)
                if (areaButtons){
                    ctx.reply(`Город: ${storage[ctx.chat.id].city} \n${product.content?product.content:''}\n`,Markup.inlineKeyboard(areaButtons))
                }else {
                    ctx.reply(`Город: ${storage[ctx.chat.id].city} \n${product.content?product.content:''}\n`,Markup.inlineKeyboard([homeBnt]))
                }
            }
        }else {
            showMainMenu(ctx)
        }
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
