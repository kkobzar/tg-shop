require('dotenv').config();
const { Telegraf, Markup} = require('telegraf');
const menu = require('./menu');

console.log(menu)

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.start((ctx) => ctx.reply(`Приветствуем в нашем боте!\nДля начала укажите ваш город:`));

bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
