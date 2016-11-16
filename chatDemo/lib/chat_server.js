var socketIo = require('socket.io');

var io;

var guestNumber = 1;

var nickNames = {};

var namesUsed = [];

var currentRoom = {};
/**
 * 分配用户昵称
 * @param socket
 * @param guestNumber
 * @param nickNames
 * @param namesUsed
 * @returns {*}
 */
function assignGuestName(socket,guestNumber,nickNames,namesUsed){
    //生成新昵称
    var name = 'Guest' + guestNumber;
    nickNames[socket.id] = name;

    //让用户知道他们的昵称
    socket.emit('nameResult',{
        success:true,
        name:name
    })
    namesUsed.push(name);
    return guestNumber + 1;
}
/**
 * 进入聊天室
 */
function joinRoom(socket,room){
    if(room === currentRoom[socket.id]){
        socket.emit('joinResult',{
            room:room,
            resCode:300,
            msg:"已在该房间!!"
        });
        return;
    }
    socket.join(room);//让用户进入房间
    currentRoom[socket.id] = room;//记录用户的当前房间

    //让用户知道他们进入了新的房间
    socket.emit('joinResult',{
        room:room,
        resCode:200
    })
    //让房间里的其他用户知道有新用户进入了房间
    socket.broadcast.to(room).emit('message',{
       text:nickNames[socket.id] + ' has joined ' +room +'.'
    });

    //确定有哪些用户在房间里
    var usersInRoom = io.sockets.clients(room);

    if(usersInRoom.length > 1){
        //如果不止一个用户在这个房间里,汇总一下都有谁
        var usersInRoomSummary = 'Users currently in '+room +':';
        for(var index in usersInRoom){
            var userSocketId = usersInRoom[index].id;
            if(userSocketId != socket.id){
                if(index > 0){
                    usersInRoomSummary += ', ';
                }
                usersInRoomSummary += nickNames[userSocketId];
            }
        }
        usersInRoomSummary+='.';

        //将房间里其他用户的汇总发送给这个用户
        socket.emit('message',{text:usersInRoomSummary});
    }
}
/**
 * 处理昵称变更请求
 */
function handleNameChangeAttempts(socket,nickNames,namesUsed){
    //添加nameAttempt事件的监听器
    socket.on('nameAttempt',function(name){
        if(name.indexOf('Guest') == 0){
            //昵称不能以Guest开头
            socket.emit('nameResult',{
                success:false,
                message:'Name cannot begin with Guest'
            });
        }else{
            if(namesUsed.indexOf(name) == -1){
                //昵称还未被注册
                var previousName = nickNames[socket.id];
                var previousNameIndex = namesUsed.indexOf(previousName);
                namesUsed.push(name);
                nickNames[socket.id] = name;
                delete namesUsed[previousNameIndex]; //删掉之前用的昵称

                socket.emit('nameResult',{
                    success:true,
                    name:name
                });

                socket.broadcast.to(currentRoom[socket.id]).emit('message',{
                    text:previousName + 'is now known as '+ name + '.'
                })
            }else{
                //昵称已经被占用
                socket.emit('nameResult',{
                    success:false,
                    message:'That name is already in use'
                })
            }
        }
    })
}
/**
 * 发送聊天消息
 * @param socket
 */
function handleMessageBroadcasting(socket,nickNames){
    socket.on('message',function(message){
        socket.broadcast.to(message.room).emit('message',{
            text:nickNames[socket.id] + ' : ' + message.text
        })
    })
}
/**
 * 创建房间
 * @param socket
 */
function handleRoomJoining(socket){
    socket.on('join',function(room){
        socket.leave(currentRoom[socket.id]);
        joinRoom(socket,room.newRoom);
    })
}
/**
 * 用户断开连接
 */
function handleClientDisconnection(socket){
    socket.on('disconnect',function(){
        var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
        delete namesUsed[nameIndex];
        delete nickNames[socket.id];
    })
}
/**
 * 表情发送
 * @param socket
 */
function handleSendImg(socket,nickNames){
    //new image get
    socket.on('img', function(imgData, color) {
        socket.broadcast.emit('newImg', nickNames[socket.id], imgData, color);
    });
}
exports.listen = function(server){
    io = socketIo.listen(server);
    io.sockets.on('connection',function(socket){
        guestNumber = assignGuestName(socket,guestNumber,nickNames,namesUsed);
        joinRoom(socket,'Lobby');

        handleMessageBroadcasting(socket,nickNames);   //处理用户的消息，更名以及聊天室的创建和变更
        handleNameChangeAttempts(socket,nickNames,namesUsed);
        handleRoomJoining(socket);
        handleSendImg(socket,nickNames);

        //用户发出请求时,向其提供已经被占用的聊天室的列表
        // socket.on('rooms',function(){
        //     socket.emit('rooms',io.sockets.manager.rooms);
        // });
        //定义用户断开连接后的清除逻辑
        handleClientDisconnection(socket,nickNames,namesUsed);

    })
};
