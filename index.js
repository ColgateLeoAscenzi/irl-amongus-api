const httpServer = require('http').createServer();
const io = require('socket.io')(httpServer, {
    cors: {
        origin: 'http://localhost:3000',
    },
});
const port = process.env.PORT || 8080;

const rooms = {};

io.on('connection', (socket) => {
    socket.on('create-room', (data) => {
        if (rooms[data.roomcode]) {
            // TODO add add player
        } else {
            rooms[data.roomcode] = {
                players: [],
            };
            rooms[data.roomcode].players.push({
                id: socket.id,
                name: data.name,
            });
            io.sockets.emit('new-player', rooms[data.roomcode].players);
        }
    });
});

httpServer.listen(port, () => {
    // console.log(`listening on *:${port}`);
});
