$(function() {

    var Socket = null,
        User = null,
        Chat = null;


    var establishConnection = function() {

        Socket = io('http://localhost:3000');

        Socket.on('welcome', function() {
            console.log('Socket connection established');
        });
    };

    establishConnection();




    var loginBtn = $('.login'),
        modalTrigger = $('.registerModalTrigger'),
        registerBtn = $('.registrationBtn'),
        chatrooms = $('.chatrooms');


    var doLogin = function() {
        var user = $('.loginUsername').val(),
            pass = $('.loginPassword').val();

        var pkg = {
            u: user,
            p: pass
        };


        var onSuccess = function(data) {
            if (data === 'ERR') console.log('ERROR');
            $('.landing').addClass('invisible');
            chatrooms.removeClass('invisible');
            User = data;
        };

        $.ajax({
            url: '/login',
            method: 'POST',
            data: pkg,
            success: onSuccess
        });

    };




    var doRegistration = function() {
        var user = $('.registerUsername').val(),
            pass = $('.registerPassword').val();

        var pkg = {
            u: user,
            p: pass
        };

        var onSuccess = function(data) {
            if (data === 'ERR') console.log('ERROR');
        };

        $.ajax({
            url: '/register',
            method: 'POST',
            data: pkg,
            success: onSuccess
        });

    };



    modalTrigger.click(function() {
        $('#registrationModal').modal('show');
    });


    registerBtn.on('click', doRegistration);
    loginBtn.on('click', doLogin);



    // REAL CHAT PART
    var searchBtn = $('.searchBtn'),
        searchTerm = $('.term'),
        searchBox = $('.searchBox'),
        chatTemplate = $('.chatTemplate');



    var appendMessage = function(msg) {
        var messageWrap = $('.messages'),
            message = $('<div>').addClass('messageContainer');

        $('<div>').html(msg.sender).addClass('messageSender').appendTo(message);
        $('<div>').html(msg.text).addClass('messageText').appendTo(message);
        $('<div>').html(msg.date).appendTo(message);
        message.appendTo(messageWrap);
    };

    var search = function() {
        var pkg = {};

        pkg.user = User.user;
        pkg.term = searchTerm.val();
        pkg.id = User.id;

        var onSuccess = function(data) {
            if (data === 'ERR') console.log('ERROR');

            var chat = data[0];

            Chat = chat;

            $('<div>').html(chatTemplate.html()).removeClass('invisible').addClass('chat').insertAfter(searchBox);

            if (chat.messageObjects != undefined) {
                if (chat.messageObjects.length > 0) {
                    chat.messageObjects.forEach(function(message) {
                        appendMessage(message);
                    });
                }
            }


            var sendMessage = $('.sendMessage');

            var send = function() {
                var message = $('.message').val();

                if (!message.length) return;

                var pkg = {
                    msg: message,
                    user: User.user,
                    chat: Chat.id
                };

                Socket.emit('message', pkg);
            };

            sendMessage.on('click', send);

            Socket.on('message', appendMessage);
        };



        $.ajax({
            url: '/search',
            method: 'POST',
            data: pkg,
            success: onSuccess
        });

    };



    searchBtn.on('click', search);




});
