function divEscapedContentElement(message){
    return $('<div class="croom"></div>').text(message);
}
function divSystemContentElement(message){
    return $('<div></div>>').html('<i>' + message + '</i>');
}
/**
 * 处理用户的原始输入
 * @param chatApp
 * @param socket
 */
function processUserInput(chatApp,socket){
    var message = $('#send-message').val();
    var systemMessage;
    if(message.charAt(0) == '/'){
        systemMessage = chatApp.processCommand(message);
        if(systemMessage){
            $('#messages').append(divSystemContentElement(systemMessage));
        }
    }else{
        chatApp.sendMessage($('#room').text(),message);
        $('#messages').append(divEscapedContentElement(message));
        $('#messages').scrollTop($('#messages').prop('scrollHeight'));
    }
    $('#send-message').val('');
}
var socket = io.connect();
$(document).ready(function(){

    var chatApp = new Chat(socket);

    socket.on('nameResult',function(result){
        var message;
        if(result.success){
            message = 'You are now konwn as '+result.name+'.';
        }else{
            message = result.message;
        }
        $('#messages').append(divSystemContentElement(message));
        $('#messages').scrollTop($('#messages').prop('scrollHeight'));
    });

    socket.on('joinResult',function(result){
        if(result.resCode === 300){
            $('#messages').append(divSystemContentElement(result.msg));
            $('#messages').scrollTop($('#messages').prop('scrollHeight'));
            return;
        }
        $('#room').text(result.room);
        $('#messages').append(divSystemContentElement('Room changed.'));
        $('#messages').scrollTop($('#messages').prop('scrollHeight'));
        var elements$ = $('#room-list').find('.croom');
        var arr = [];
        elements$.each(function(i){
            arr.push($(this).text());
        })
        if(arr.indexOf(result.room) == -1){
            $('#room-list').append(divEscapedContentElement(result.room));
        }
    });
    socket.on('newImg', function(user, img, color) {
        displayImage(img, color);
    });
    socket.on('message',function(message){
        var newElement = $('<div></div>').text(message.text);
        $('#messages').append(newElement);
        $('#messages').scrollTop($('#messages').prop('scrollHeight'));
    });
    socket.on('userGroup',function(message){
        $('#userGroup').empty();
        console.log(message.group)
        var group = message.group;
        var i = 0;
        while(i <= group.length-1){
            if(group[i] != null){
                var newElement = $('<div></div>').text(group[i]);
                $('#userGroup').append(newElement);
            }
            i++;
        }
    });
    $('#send-message').focus();

    $('#send-form').submit(function(){
        processUserInput(chatApp,socket);
        return false;
    });
    $('#room-list').click(function(e){
        if(!!$(e.target).text()){
            chatApp.processCommand('/join ' + $(e.target).text());
            $('#send-message').focus();
        }
    });
})