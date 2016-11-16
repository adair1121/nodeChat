var http = require('http');
var path = require('path');
var fs = require('fs');
var mine = require('./mine').types; //附加的mime模块有根据文件扩展名得出mime类型的能力
var url = require('url');
var chatServer = require('./chatDemo/lib/chat_server');
var cache = {}; //缓存文件内容的对象

//错误响应
function send404(response){
    response.writeHead(404,{'Content-type':'text/plain'});
    response.write('Error 404 : resource not found');
    response.end();
}
//发送文件内容
function sendFile(response,filePath,fileContents,contentType){
    response.writeHead(200,{'Content-type':contentType});
    response.end(fileContents);
}
// 访问内存（RAM）要比访问文件系统快得多，所以Node程序通常会把常用的数据缓存到内
// 存里。我们的聊天程序就要把静态文件缓存到内存中，只有第一次访问的时候才会从文件系统中
// 读取。下一个辅助函数会确定文件是否缓存了，如果是，就返回它。如果文件还没被缓存，它会
// 从硬盘中读取并返回它。如果文件不存在，则返回一个HTTP 404错误作为响应

function serverStatic(response,cache,absPath,contentType){
    if(cache[absPath]){
        sendFile(response,absPath,cache[absPath],contentType);
    }else{
        fs.exists(absPath,function(exists){
            if(exists){
                fs.readFile(absPath,function(err,data){
                    if(err){
                        send404(response);
                    }else{
                        cache[absPath] = data;
                        sendFile(response,absPath,data,contentType);
                    }
                })
            }else{
                send404(response);
            }
        })
    }
}

//创建http服务
var server = http.createServer(function(req,res){
    var pathname = url.parse(req.url).pathname;
    
    var realPath = __dirname + '/chatDemo' + pathname;
    var ext = path.extname(realPath);
    ext = ext? ext.slice(1):'unknow';
    var contentType = mine[ext] || 'text/plain';

    serverStatic(res,cache,realPath,contentType);
});

server.listen(3000,function(){
    console.log('Server listening on port 3000.');
})

//处理socket.IO聊天功能
 chatServer.listen(server);