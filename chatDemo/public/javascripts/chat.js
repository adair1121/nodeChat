var Chat = function(socket){
    this.socket = socket;
};
/**
 * 发送聊天消息
 * @param room
 * @param text
 */
Chat.prototype.sendMessage = function(room,text){
    var message = {
        room:room,
        text:text
    };
    this.socket.emit('message',message);
}
/**
 * 变更房间
 * @param room
 */
Chat.prototype.changeRoom = function(room){
    this.socket.emit('join',{
        newRoom:room
    })
}
/**
 * 处理聊天命令
 * @param command
 */
Chat.prototype.processCommand = function(command){
    var words = command.split(' ');
    var cmd = words[0].substring(1,words[0].length).toLowerCase();
    var message = false;

    switch(cmd){
        case 'join':
            words.shift();
            var room = words.join(' ');
            this.changeRoom(room);
            break;
        case 'nick':
            words.shift();
            var name = words.join(' ');
            this.socket.emit('nameAttempt',name);
            break;
        default:
            message = 'Unrecognized command.';
            break;
    }
    return message;
}