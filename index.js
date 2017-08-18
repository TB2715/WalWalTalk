/*-----------------------------------------------------------------------------
This Bot uses the Bot Connector Service but is designed to showcase whats 
possible on Facebook using the framework. The demo shows how to create a looping 
menu how send things like Pictures, Bubbles, Receipts, and use Carousels. It also
shows all of the prompts supported by Bot Builder and how to receive uploaded
photos, videos, and location.

# RUN THE BOT:

    You can run the bot locally using the Bot Framework Emulator but for the best
    experience you should register a new bot on Facebook and bind it to the demo 
    bot. You can run the bot locally using ngrok found at https://ngrok.com/.

    * Install and run ngrok in a console window using "ngrok http 3978".
    * Create a bot on https://dev.botframework.com and follow the steps to setup
      a Facebook channel. The Facebook channel config page will walk you through 
      creating a Facebook page & app for your bot.
    * For the endpoint you setup on dev.botframework.com, copy the https link 
      ngrok setup and set "<ngrok link>/api/messages" as your bots endpoint.
    * Next you need to configure your bots MICROSOFT_APP_ID, and
      MICROSOFT_APP_PASSWORD environment variables. If you're running VSCode you 
      can add these variables to your the bots launch.json file. If you're not 
      using VSCode you'll need to setup these variables in a console window.
      - MICROSOFT_APP_ID: This is the App ID assigned when you created your bot.
      - MICROSOFT_APP_PASSWORD: This was also assigned when you created your bot.
    * Install the bots persistent menus following the instructions outlined in the
      section below.
    * To run the bot you can launch it from VSCode or run "node app.js" from a 
      console window. 

# INSTALL PERSISTENT MENUS

    Facebook supports persistent menus which Bot Builder lets you bind to global 
    actions. These menus must be installed using the page access token assigned 
    when you setup your bot. You can easily install the menus included with the 
    example by running the cURL command below:

        curl -X POST -H "Content-Type: application/json" -d @persistent-menu.json 
        "https://graph.facebook.com/v2.6/me/thread_settings?access_token=PAGE_ACCESS_TOKEN"
    
-----------------------------------------------------------------------------*/
var express = require('express');
var restify = require('restify');
var builder = require('./core/');
var mysql = require('mysql');
var connection = mysql.createConnection({
    host: '118.42.88.117',
    user: 'root',
    password: 'qwer1234',
    database: 'NIC'
});
connection.connect();
//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

//=========================================================
// Bots Middleware
//=========================================================

// Anytime the major version is incremented any existing conversations will be restarted.
bot.use(builder.Middleware.dialogVersion({ version: 1.0, resetCommand: /^reset/i }));

//=========================================================
// Bots Global Actions
//=========================================================

bot.endConversationAction('goodbye', '다음에 또 만나요! 안녕!! :-D', { matches: /^goodbye/i });
bot.beginDialogAction('help', '/help', { matches: /^help/i });
bot.beginDialogAction('talk', '/talk', { matches: /^talk/i });
bot.beginDialogAction('setting', '/setting', { matches: /^setting/i });

//=========================================================
// Bots Dialogs
//=========================================================
var talk_level = 0;
var setting = 0;
var user_name, pet_name, age, weight;
var s_sleep, s_wait, s_bomb, s_play;

bot.dialog('/', [
    function (session) {
        // Send a greeting and show help.
        var card = new builder.HeroCard(session)
            .title("왈왈톡")
            .text("당신의 애완동물과 이야기하세요!")
        var msg = new builder.Message(session).attachments([card]);
        session.send(msg);
        session.send("안녕하세요, 저는 왈왈톡입니다. 저는 당신과 당신의 반려동물간에 대화를 할 수 있도록 도와드릴거에요!");
        session.beginDialog('/help');
    },
    function (session, results) {
        // Display menu
        if(setting == 0)
            session.beginDialog('/setting');
        else
            session.beginDialog('/state');
    },
    function (session, results) {
        // Always say goodbye
        session.send("Ok... See you later!");
    }
]);

bot.dialog('/setting', [
    function (session) {
      session.send("처음에는 당신과 당신의 반려동물의 정보를 등록할거에요. \n\n이 후에 설정사항을 변경하고 싶으시다면 'setting'을 입력해주세요.");
      builder.Prompts.text(session, "당신의 이름을 등록해주세요.");
    },
    function (session, results) {
      //session.send("입력하신 당신의 이름이 '%s'(이)가 맞나요?", results.response);
      user_name = results.response;
      builder.Prompts.text(session, "당신의 반려동물의 이름을 등록해주세요.");
    },
    function (session, results) {
      pet_name = results.response;
      builder.Prompts.number(session, "당신의 반려동물의 나이를 등록해주세요.(단위: 년)");
    },
    function(session, results){
      age = results.response;
      builder.Prompts.number(session, "당신의 반려동물의 몸무게를 등록해주세요.(단위: kg)");
    },
    function(session, results){
      weight = results.response;
      session.send("입력한 내용입니다.\n\n- 당신의 이름: %s\n\n- 반려동물의 이름: %s\n\n- 반려동물의 나이: %s살\n\n- 반려동물의 몸무게: %skg", user_name, pet_name, age, weight);
      builder.Prompts.text(session, "입력한 내용이 맞나요? Yes 아니면 No 로 대답해주세요.");
    },
    function(session, results){
      var check = results.response;
      session.send("you said %s", check);
      if(check == 'no')
        session.beginDialog('/setting');
      else{
        setting = 1;
        session.beginDialog('/state');
      }
    }
]);

// bot.dialog('/talk', [
//     function(session){
//         session.send("");
//     }
// ]);


bot.dialog('/menu', [
    function(session){
        builder.Prompts.text(session, "<메뉴>\n\n");
    },
    function (session, results) {
        if (results.response && results.response != '(quit)') {
            // Launch demo dialog
            session.send("You choose '" + results.response + "'. ");
            session.beginDialog('/state');
        } else {
            // Exit the menu
            session.endDialog();
        }
    },
    function (session, results) {
        // The menu runs a loop until the user chooses to (quit).
        session.replaceDialog('/menu');
    }
]).reloadAction('reloadMenu', null, { matches: /^menu|show menu/i });

bot.dialog('/help', [
    function (session) {
        session.endDialog("왈왈톡의 기능들:\n\n* menu - 왈왈톡으로 할 수 있는 기능들을 볼 수 있어요.\n* goodbye - 왈왈톡을 끄고 싶을 때 말해주세요.\n* help - 왈왈톡을 어떻게 사용할 지 모르겠는 경우 말해주세요.");
    }
]);

bot.dialog('/state', [
    function(session){
        builder.Prompts.text(session, "당신의 " + pet_name + "(이)의 어떤 상태가 궁금한가요?");
    },
    function(session, results){
        connection.query('SELECT * from module', function(err, rows, fields) {
            if(!err){
                if(rows[0].sleep)
                    session.send("주인님, 나 잘 자고있어요!(´ε｀*)");
                if(rows[0].wait)
                    session.send("주인님, 언제 돌아와요? 기다리고 있어요...(つд⊂)");
                if(rows[0].bomb)
                    session.send("주인님, 쓰레기통이 저한테 시비를 걸어요 (ಠ益ಠ)! 혼내줘야겠어요!!");
                if(rows[0].play)
                    session.send("주인님, 덕분에 재밋게 놀고있어요! 짱신나요 ~(꒪꒳꒪)~!");
                if(rows[0].sleep==0 && rows[0].wait==0 && rows[0].bomb==0 && rows[0].play==0)
                    session.send("뒹굴 뒹굴 뒹구르르르르\n\n(っ´ω｀c)");
            }
            else
                console.log('Error while performing Query.', err);
        });
    },
    function(session, results){
        ession.beginDialog("/state");
    }
]);

