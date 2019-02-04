const cheerio = require('cheerio');
const TelegramBot = require('node-telegram-bot-api');
const nodemailer = require("nodemailer");

let bot;

if(process.env.token) {
    bot = new TelegramBot(process.env.token, {polling: true});
}

let list_user={};
let html_more="";

if(process.env.token) {
    bot.on('message', (msg) => {
        const chatId = msg.chat.id;
        list_user[chatId] = chatId;

        html_more = html_more.substr(0, 4000);

        if (msg.text == "/last" && html_more) {
            bot.sendMessage(chatId, html_more, {parse_mode: "HTML"});
        } else if (msg.text != "/last") {
            bot.sendMessage(chatId, `List command: \n /last`, {parse_mode: "HTML"});
        }
    });
}
const puppeteer = require('puppeteer');

start();

function start() {
    (async () => {
        try {

            const browser = await puppeteer.launch({
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox'
                ]
            });

            const page = await browser.newPage();

            await page.goto(process.env.url, {
                waitUntil: 'networkidle2',
                timeout: 60*1000
            });

            // Get the "viewport" of the page, as reported by the page.
            const html = await page.evaluate(async () => {
                return await new Promise((resolve, reject) => {
                    console.log("await");
                    let count=0;
                    try {
                        const interval = setInterval(() => {
                            var isMobileVersion = document.getElementsByClassName('go2tour');
                            if (isMobileVersion.length > 0) {
                                clearInterval(interval);
                                resolve(document.body.innerHTML);
                            } else {
                                console.log("Not find content = "+count);
                                count++;
                                if(count>=10) {
                                    clearInterval(interval);
                                    resolve("");
                                }
                            }
                        }, 1000);
                    } catch (err) {
                        reject(err.toString());
                    }
                })
            });

            if(!html) {
                run_start();
                return false;
            }

            send_data(html);
            run_start();

            await browser.close();
        } catch (err) {
            console.log(err);
            run_start();
        }
    })();
}

function save_in_file(html) {
    const fs = require('fs');
    fs.writeFile("test.html", html, function(err) {
        if(err) {
            return console.log(err);
        }

        console.log("The file was saved!");
    });
}

function send_data(bodyHTML) {
    const $ = cheerio.load(`<html><body>${bodyHTML}</body></body>`);

    let ar = [];
    $(".character").each(function (i, elem) {
        let price = $(elem).find(".btn-book").html();
        price = new String(price).replace(/(\$.*)/i, "").trim();
        let href = $(elem).find(".btn-book").attr("href");
        ar.push({
            price: price,
            href: `https://misto.travel/${href}`
        });
    });

    let html_less= "";
    html_more= new Date()+`\n\n`;
    ar.map((elem) => {
        if(elem.price<process.env.max_price) {
            html_less += `<b>${elem.price}$</b> - ${elem.href} \n\n`;
        } else {
            html_more += `<b>${elem.price}$</b> - ${elem.href} \n\n`;
        }
    });

    if(html_less) {
        html_less=new Date()+`\n\n`+html_less;
    }

    if(html_less) {

        if(process.env.token) {
            for (elem in list_user) {
                bot.sendMessage(elem, html_less, {parse_mode: "HTML"});
            }
        }

        if(process.env.email) {
            html_less=html_less.replace(/\n/g,"<br>");
            send_email(html_less).catch(console.error);
        }

    } else {
        // for(elem in list_user) {
        //     bot.sendMessage(elem,  new Date()+`\n\nThere are no such cheap prices`, {parse_mode: "HTML"});
        // }
    }
}

function run_start() {
    setTimeout(() => {
        console.log("Start!");
        start();
    }, 1e3 * 15);
}

async function send_email(html_less){
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
    let account = await nodemailer.createTestAccount();

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: account.user, // generated ethereal user
            pass: account.pass // generated ethereal password
        }
    });

    console.log(process.env.email);

    // setup email data with unicode symbols
    let mailOptions = {
        from: `"Admin 👻" <${process.env.email}>`,
        to: process.env.email,
        subject: "Alert - low price Misto Travel",
        html: html_less
    };

    // send mail with defined transport object
    let info = await transporter.sendMail(mailOptions)

    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}