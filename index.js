const {
    NEW_PLAYER,
    JOINED_ROOM,
    PLAYER_EXISTS_ALREADY,
} = require('./store/actions');
const { getPlayers, getPlayerStatuses } = require('./store/players/selectors');
const { addPlayer, killPlayer } = require('./store/players/updaters');
const { startGame } = require('./store/game/updaters');
const { taskList } = require('./tasks');

const { logInfo, logError } = require('./logger/loggerUtils');

const fs = require('fs');
const dotenv = require('dotenv');
const result = dotenv.config();
if (result.error) {
    throw result.error;
}
if (fs.existsSync('.env.local')) {
    const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const express = require('express');
const cors = require('cors');
const app = express();
const http = require('http');
const { ROLE_IMPOSTER } = require('./store/players/consts');
const { checkImposterWinKill } = require('./store/players/utils');
const server = http.createServer(app);

const corsOptions = {
    origin: process.env.BASE_URL,
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};
app.use(cors(corsOptions));
const io = require('socket.io')(server, {
    cors: {
        origin: process.env.BASE_URL,
    },
});
const port = process.env.PORT;

app.get('/', (req, res) => {
    res.send({ status: 'Up' });
});

// rooms: {code1: {playerNames: {p1: true, p2: true}, players: [{id1, p1}, {id2: p2}]}, code2: {}}
let rooms = {};

// gameData: {code1: {inProgress: false, inMeeting: false, emergency: [false, false],  task [Object, object], gameOver: false, crewWin: false, imposterWin: false}}
let gameData = {};

io.on('connection', (socket) => {
    // init
    socket.on('create-room', (data) => {
        const roomCode = data?.roomCode;
        const name = data?.name;
        const socketId = socket.id;

        // Successful room request, room exists
        if (roomCode && rooms[roomCode]) {
            if (!rooms[roomCode].playerNames[name]) {
                const room = rooms[roomCode];
                rooms[roomCode] = addPlayer(room, name, socketId);

                socket.join(roomCode);
                socket.emit(JOINED_ROOM, {
                    players: getPlayers(room),
                    roomCode: roomCode,
                    name: name,
                });
                io.sockets.emit(NEW_PLAYER, getPlayers(room));

                logInfo(`Updated Room: ${roomCode}, added player: ${name}`);
            } else {
                socket.emit(PLAYER_EXISTS_ALREADY, name);
            }
            // Successful room request, room doesn't exist
        } else if (roomCode) {
            const room = {
                playerData: {},
                playerNames: {},
                players: [],
            };
            const roomData = {
                inProgress: false,
                inMeeting: false,
                emergency: [false, false],
                tasks: taskList,
                totalTasks: 56,
                tasksComplete: 0,
                impostersAlive: 0,
                crewAlive: 0,
                gameOver: false,
                crewWin: false,
                imposterWin: false,
            };

            // create a new room with first player
            rooms[roomCode] = addPlayer(room, name, socketId);

            // create new game data
            gameData[roomCode] = roomData;

            // tell player they joined, tell players someone's there
            socket.join(roomCode);
            socket.emit(JOINED_ROOM, {
                players: getPlayers(room),
                roomCode: roomCode,
                name: name,
            });
            io.sockets.emit(NEW_PLAYER, getPlayers(room));

            logInfo(`Created Room: ${roomCode}, added player: ${name}`);
        } else {
            logError(`Error: Received Undefined Room Code of: ${roomCode}`);
        }
    });

    // game logic
    socket.on('start-game', ({ roomCode }) => {
        const roomData = gameData[roomCode];
        gameData[roomCode] = startGame(roomData);
        io.to(roomCode).emit('game-started');
    });

    // player logic
    socket.on('kill', ({ roomCode, name }) => {
        const roomOld = rooms[roomCode];
        const roomDataOld = gameData[roomCode];
        const { room, roomData } = killPlayer(roomOld, roomDataOld, name);
        rooms[roomCode] = room;
        gameData[roomCode] = roomData;
        socket.emit('killed');
        checkImposterWinKill(roomData) &&
            io.sockets.emit('game-over', { winner: ROLE_IMPOSTER });
    });

    // task logic
    socket.on('view-scanner', ({ roomCode }) => {
        const room = rooms[roomCode];
        const playerStats = getPlayerStatuses(room);
        socket.emit('scanner-viewed', { playerStatus: playerStats });
    });

    // util
    socket.on('reset-all-rooms', () => {
        rooms = {};
        gameData = {};
        io.sockets.emit('reset-all-rooms');
        logInfo(`Reset All Rooms: ${rooms}`);
    });

    socket.on('reset-room', ({ roomCode }) => {
        delete gameData[roomCode];
        delete rooms[roomCode];
        io.to(roomCode).emit('reset-room');
        logInfo(`Reset Room: ${roomCode}`);
    });

    socket.on('fetch-admin-data', () => {
        socket.emit('admin-data', { rooms: rooms, gameData: gameData });
    });
});

server.listen(port, () => {
    logInfo(`listening on *:${port}`);
    logInfo(`open to requests from ${process.env.BASE_URL}`);
});
