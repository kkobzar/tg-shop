require('dotenv').config();
const { Telegraf, Markup,Format} = require('telegraf');
const menu = require('./menu');
const {rub2btc} = require('./helpers/conversionHelper')

const bot = new Telegraf(process.env.BOT_TOKEN);
const storage = {};

const homeBnt = Markup.button.callback('🏡 Главная', 'main')

//---payment buttons
const payBtn = [[Markup.button.callback('BTC (Легкий перевод)','btc-pay')],
    [Markup.button.callback('XLM <b>(Маленькая комиссия)</b>','xlm-pay')]]
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

//---Get all districts

let districts =[]

for (let cty in menu.cities){
    for (let dstrct in menu.cities[cty].districts){
        districts.push(menu.cities[cty].districts[dstrct])
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
        ctx.reply(Format.bold('Выбирай:'),Markup.inlineKeyboard(mnu))
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

/*
*
* CITY AREA BIND
*
* */
for (let area of districts){
    bot.action(area.key,ctx=>{
        if (!storage[ctx.chat.id] || typeof storage[ctx.chat.id].city === 'undefined'){
            showMainMenu(ctx)
            return
        }
        if (typeof storage[ctx.chat.id].product === 'undefined' || !storage[ctx.chat.id].product){
            showProductMenu(ctx,getProducts(storage[ctx.chat.id].city))
            return
        }

        storage[ctx.chat.id].area = area.key;
        let productInfo = getProductInfo(storage[ctx.chat.id].city,storage[ctx.chat.id].product)
        ctx.reply(`Товар: ${productInfo.title}\nГород: ${storage[ctx.chat.id].city}\nРаён: ${area.key}\nОплата:`,Markup.inlineKeyboard([...payBtn,[homeBnt]]))
    })
}

/*
*
* PAYMENT ( ͡° ͜ʖ ͡°)
*
* */

bot.action('btc-pay',ctx=>{
    if (!storage[ctx.chat.id] || typeof storage[ctx.chat.id].city === 'undefined'){
        showMainMenu(ctx)
        return
    }
    if (typeof storage[ctx.chat.id].product === 'undefined' || !storage[ctx.chat.id].product){
        showProductMenu(ctx,getProducts(storage[ctx.chat.id].city))
        return
    }

    let productInfo = getProductInfo(storage[ctx.chat.id].city,storage[ctx.chat.id].product)
    if (typeof storage[ctx.chat.id].area === 'undefined' || !storage[ctx.chat.id].area){
        ctx.deleteMessage()
        ctx.reply(`Товар: ${productInfo.title}\nГород: ${storage[ctx.chat.id].city}\nРаён: ${storage[ctx.chat.id].area}\nОплата:`,Markup.inlineKeyboard([...payBtn,[homeBnt]]))
        return;
    }
    rub2btc(productInfo.price)
        .then(btcPrice=>{
            ctx.replyWithMarkdown(`К оплате : *${btcPrice} BTC* \n`+"Кошелек: `1BsDk9mSvvgrQMmP8du3FtFStCuR2dPAr4`\n" + `Товар выдается автоматически после 3 подтверждений\n Чтобы проверить оплату нажмите кнопку "Проверить оплату"`,
                Markup.inlineKeyboard([[Markup.button.callback('Проверить оплату','check-pay')],[homeBnt]]))
        })
})

bot.action('check-pay',ctx => {
    ctx.reply('Оплата еще не прошла!\nУбедитесь в правельности реквизитов и попробуйте позже',[homeBnt])
})

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
