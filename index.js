const { NEW_PLAYER, JOINED_ROOM } = require('./store/actions');
const { getPlayers } = require('./store/selectors');
const { addPlayer } = require('./store/updaters');
const { logInfo, logError } = require('./logger/loggerUtils');

const httpServer = require('http').createServer();
const io = require('socket.io')(httpServer, {
    cors: {
        origin: 'http://localhost:3000',
    },
});
const port = process.env.PORT || 8080;

// rooms: {code1: {playerNames: {p1: true, p2: true}, players: [{id1, p1}, {id2: p2}]}, code2: {}}
let rooms = {};

io.on('connection', (socket) => {
    socket.on('create-room', (data) => {
        const roomCode = data?.roomcode;
        const name = data?.name;
        const socketId = socket.id;

        // Successful room request, room exists
        if (roomCode && rooms[roomCode]) {
            if (!rooms[roomCode].playerNames[name]) {
                const room = rooms[roomCode];
                rooms[roomCode] = addPlayer(room, name, socketId);

                socket.emit(JOINED_ROOM, getPlayers(room));
                io.sockets.emit(NEW_PLAYER, getPlayers(room));

                logInfo(`Updated Room: ${roomCode}, added player: ${name}`);
            }
            // Successful room request, room doesn't exist
        } else if (roomCode) {
            const room = {
                playerNames: {},
                players: [],
            };

            // create a new room with first player
            rooms[roomCode] = addPlayer(room, name, socketId);

            // tell player they joined, tell players someone's there
            socket.emit(JOINED_ROOM, getPlayers(room));
            io.sockets.emit(NEW_PLAYER, getPlayers(room));

            logInfo(`Created Room: ${roomCode}, added player: ${name}`);
        } else {
            logError(`Error: Recieved Undefined Roomcode of: ${roomCode}`);
        }
    });

    socket.on('reset-rooms', () => {
        rooms = {};
        io.sockets.emit('reset-all-rooms');
        logInfo(`Reset All Rooms: ${rooms}`);
    });
});

httpServer.listen(port, () => {
    logInfo(`listening on *:${port}`);
});
