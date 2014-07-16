var http = require('http');

var port = 3700;

var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var clients = [];

server.listen(port);

app.use(express.static(__dirname + '/public'));

app.get("/", function(req, res) {
    res.render("index");
});

app.get("/listener", function(req, res) {
    res.sendfile(__dirname + '/public/listener.html');
});

io.on('connection', function(socket) {
    console.log('connection has been established');

    // Tell the recording-client that the server is listening
    socket.emit('readyForStream', {
        go: 'play music!'
    });

    // event emitted from the recording-client
    socket.on('streaming', function(chunk) {

        console.log(chunk.stream);

        // Here we should stream the data back to all the clients
        // socket.emit('back', {
        //     chunk: chunk.stream
        // });

    });

});
