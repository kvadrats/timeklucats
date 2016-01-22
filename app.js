var Hapi = require('hapi'),
  fs = require('fs'),
  path = require('path'),
  fs = require('fs'),
  sanitizer = require('sanitizer'),
  Class = require('./classes.js');


var server = new Hapi.Server();

server.connection({
  host: '0.0.0.0',
  port: process.env.PORT || 3000
});

var io = require('socket.io')(server.listener);



server.register(require('inert'), function(err) {
  if (err) {
    console.log(err);
  }


  server.route({
    method: 'GET',
    path: '/',
    handler: function(request, reply) {
      reply.redirect('/chat/index.html');
    }
  });

  server.route({
    method: 'GET',
    path: '/chat/index.html',
    handler: function(request, reply) {
      reply.file('./client/index.html');
    }
  });

  server.route({
    method: 'POST',
    path: '/login',
    handler: function(request, reply) {

      var username = request.payload.u,
          pass = request.payload.p;


      if (!username || !pass) return reply('ERR').code(200);


      var success = false,
          welcome = {}; //welcom package

      var users = fs.readFileSync('./database/users.json'); //RETURNS BUFFER

      users = JSON.parse(users);  // parse buffer to object

      users.forEach(function(user) {
        if (user.user === username && user.pass === Class.Password(pass)) {
          welcome.user = user.user; //login
          welcome.chats = user.chats;
          welcome.id = user.id;

          success = true;
        }
      });

      if (success) reply(welcome).code(200);
      else reply('ERR').code(200);

    }
  });

  server.route({
    method: 'POST',
    path: '/register',
    handler: function(request, reply) {

      var users = fs.readFileSync('./database/users.json');

      users = JSON.parse(users);

      var record =  {};

      record.id = users.length + 1;
      record.user = request.payload.u;
      record.pass = Class.Password(request.payload.p);
      record.chats = [];


      users.push(record);


      fs.writeFileSync('./database/users.json', JSON.stringify(users));

      reply('OK').code(200);
    }
  });


  server.route({
    method: 'POST',
    path: '/search',
    handler: function(request, reply) {

      var userSearched = request.payload.term,
          userSearching = request.payload.user,
          userId = request.payload.id;


      var users = fs.readFileSync('./database/users.json');
      var chats = fs.readFileSync('./database/chats.json');
      var messages = fs.readFileSync('./database/messages.json');

      users = JSON.parse(users);
      chats = JSON.parse(chats);
      messages = JSON.parse(messages);

      var chatsBetweenUsers = [],
          pkg = []; //all chats to return

      var getMessages = function(idArray, mesages) {
        var messages = [];

        mesages.forEach(function(message) {
          idArray.forEach(function(id) {
            if (message.id === id) messages.push(message);
          });
        });

        return messages;
      };


      users.forEach(function(user) {
        if (user.user === userSearched) {

          users[userId - 1].chats.forEach(function(id) {
            chats.forEach(function(chat) {
              if (chat.id === id) {
                if (chat.participants.indexOf(userSearching) > -1) chatsBetweenUsers.push(chat);
              }
            });
          });


          if (chatsBetweenUsers.length > 0) {

            chatsBetweenUsers.forEach(function(chat) {
              if (chat.messages.length > 0) chat.messageObjects = getMessages(chat.messages, messages);
              pkg.push(chat);
            });

          } else {
            var chat = new Class.Chat([userSearching, userSearched], []);

            chat.id = chats.length + 1;

            users[userId - 1].chats.push(chat.id);
            users[user.id - 1].chats.push(chat.id);

            chats.push(chat);
            pkg.push(chat);
          }


          fs.writeFileSync('./database/users.json', JSON.stringify(users));
          fs.writeFileSync('./database/chats.json', JSON.stringify(chats));
          fs.writeFileSync('./database/messages.json', JSON.stringify(messages));

        }

      });


      if (pkg.length > 0) reply(pkg).code(200);
      else reply('NO_USER').code(200) ;

    }
  });


  server.route({
    method: 'GET',
    path: '/client/{param*}',
    handler: {
      directory: {
        path: 'client/'
      }
    }
  });



  server.start(function() {
    console.log('Server running at:', server.info.uri);
  });

});



var initSocket = function(callback) {
  io.on('connection', function (socket) {
    socket.emit('welcome');

    callback(socket);
  });

};



initSocket(function(Socket) {

  //handlers
  var handleNewMessage = function(data) {
    if (!data) return Socket.emit('message', 'ERR');

    var chats = fs.readFileSync('./database/chats.json');
    var messages = fs.readFileSync('./database/messages.json');

    chats = JSON.parse(chats);
    messages = JSON.parse(messages);


    var message = new Class.Message(data.user, sanitizer.sanitize(data.msg));

    message.id = messages.length + 1;

    chats.forEach(function(chat) {
      if (chat.id === data.chat) chat.messages.push(message.id);
    });

    messages.push(message);

    fs.writeFileSync('./database/chats.json', JSON.stringify(chats));
    fs.writeFileSync('./database/messages.json', JSON.stringify(messages));

    Socket.emit('message', message);
  };

  //listeners
  Socket.on('message', handleNewMessage);
});
