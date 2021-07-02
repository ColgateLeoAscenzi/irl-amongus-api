const {
    NEW_PLAYER,
    JOINED_ROOM,
    PLAYER_EXISTS_ALREADY,
} = require('./src/store/actions');
const {
    getPlayers,
    getPlayerStatuses,
} = require('./src/store/players/selectors');
const { addPlayer, killPlayer } = require('./src/store/players/updaters');
const { startGame } = require('./src/store/game/updaters');
const { taskList, commonTasks, shortTasks, longTasks } = require('./src/tasks');

const { logInfo, logError } = require('./src/logger/loggerUtils');

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
const { shuffle } = require('./src/store/players/utils');
const { getMasterTaskObject } = require('./src/store/game/selectors');
const { getPlayerNames } = require('./src/store/players/selectors');
const { getPlayerTasks } = require('./src/store/players/selectors');
const { playerSetInitialTasks } = require('./src/store/players/updaters');
const { ROLE_CREW } = require('./src/store/players/consts');
const { checkCrewWinTask } = require('./src/store/players/utils');
const { playerFinishTask } = require('./src/store/players/updaters');
const { playerExitTask } = require('./src/store/players/updaters');
const { playerEnterTask } = require('./src/store/players/updaters');
const { ROLE_IMPOSTER } = require('./src/store/players/consts');
const { checkImposterWinKill } = require('./src/store/players/utils');
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
                inEmergency: false,
                pressingEmergency: 0,
                tasks: getMasterTaskObject(taskList),
                shortTasks: shortTasks,
                commonTasks: commonTasks,
                longTasks: longTasks,
                emergencyDuration: 2,
                totalTasks: 0,
                tasksComplete: 0,
                impostersAlive: 0,
                crewAlive: 0,
                selectedCommonTask: Math.round(Math.random() * 0),
                numCommonTasks: 1,
                numShortTasks: 5,
                numLongTasks: 2,
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
        const room = rooms[roomCode];
        const roomData = gameData[roomCode];
        gameData[roomCode] = startGame(roomData);
        gameData[roomCode].totalTasks =
            room.players.length *
            (gameData[roomCode].numCommonTasks +
                gameData[roomCode].numShortTasks +
                gameData[roomCode].numLongTasks);
        const playerNames = getPlayerNames(room);
        for (let i = 0; i < playerNames.length; i++) {
            const name = playerNames[i];
            room.playerData[name].taskList = playerSetInitialTasks(
                room,
                roomData,
                name,
            );
        }

        let numImposters;
        if (playerNames.length <= 6) {
            numImposters = 1;
        } else {
            numImposters = 2;
        }

        const playerData = room.playerData;
        const shuffled = shuffle(playerNames);

        for (let i = 0; i < numImposters; i++) {
            const name = shuffled[i];
            playerData[name].role = ROLE_IMPOSTER;
        }

        gameData[roomCode].impostersAlive = numImposters;
        gameData[roomCode].crewAlive = playerNames.length - numImposters;

        rooms[roomCode].playerData = playerData;

        io.to(roomCode).emit('game-started', {
            totalTasks: gameData[roomCode].totalTasks,
            masterTaskList: gameData[roomCode].tasks,
        });
    });

    socket.on('get-role', ({ roomCode, name }, fn) => {
        const room = rooms[roomCode];
        const role = room.playerData[name].role;
        fn(role);
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
            io.to(roomCode).emit('game-over', { winner: ROLE_IMPOSTER }) &&
            logInfo(`Game Over, Imposters Won! Room: ${roomCode}`);
    });

    socket.on('report', ({ roomCode }) => {
        const roomOld = rooms[roomCode];
        const roomDataOld = gameData[roomCode];
        const playerStatuses = getPlayerStatuses(roomOld);
        roomDataOld.inMeeting = true;
        io.to(roomCode).emit('started-meeting', {
            playerStatuses: playerStatuses,
        });
    });

    socket.on('start-meeting', ({ roomCode }) => {
        const roomOld = rooms[roomCode];
        const roomDataOld = gameData[roomCode];
        roomDataOld.inMeeting = true;

        const playerStatuses = getPlayerStatuses(roomOld);

        io.to(roomCode).emit('started-meeting', {
            playerStatuses: playerStatuses,
        });
    });

    socket.on('end-meeting', ({ roomCode }) => {
        const roomOld = rooms[roomCode];
        const roomDataOld = gameData[roomCode];
        const players = Object.keys(roomOld.playerData);
        const voteArray = [];

        for (let i = 0; i < players.length; i++) {
            voteArray.push({
                // crashes on this line
                votes: roomDataOld[players[i].name].votes,
                name: players[i].name,
            });
        }

        const unsortedArr = voteArray;

        voteArray.sort((a, b) => {
            const keyA = a.votes;
            const keyB = b.votes;
            if (keyA < keyB) return 1;
            if (keyA > keyB) return -1;
            return 0;
        });

        const killedPlayer = voteArray[0].name;

        const { room, roomData } = killPlayer(
            roomOld,
            roomDataOld,
            killedPlayer,
        );

        io.to(roomCode).emit('final-votes', { voteList: unsortedArr });

        // reset votes
        for (let i = 0; i < players.length; i++) {
            roomData.playerData[players[i].name].votes = 0;
        }
        roomData.inMeeting = false;
        rooms[roomCode] = room;
        gameData[roomCode] = roomData;

        setTimeout(() => {
            io.to(roomCode).emit('meeting-ended', {
                killedPlayer: killedPlayer,
            });
        }, 5000);
    });

    socket.on('vote', ({ roomCode, name }) => {
        const roomOld = rooms[roomCode];
        roomOld.playerData[name].votes += 1;
        rooms[roomCode] = roomOld;
    });

    socket.on('call-emergency', ({ roomCode, name }) => {
        const roomOld = rooms[roomCode];
        const roomDataOld = gameData[roomCode];

        if (
            !roomDataOld.inEmergency &&
            roomOld.playerData[name].role === ROLE_IMPOSTER
        ) {
            io.to(roomCode).emit('emergency-started');
            io.to(`${roomCode}Sound`).emit('start-emergency-sound');
            roomDataOld.inEmergency = true;
        }
        gameData[roomCode] = roomDataOld;
        setTimeout(() => {
            if (gameData[roomCode].inEmergency) {
                io.to(roomCode).emit('game-over', { winner: ROLE_IMPOSTER });
            } else {
                io.to(roomCode).emit('emergency-over');
                io.to(`${roomCode}Sound`).emit('stop-emergency-sound');
            }
        }, roomDataOld.emergencyDuration * 1000);
    });

    socket.on('stop-emergency-onPress', ({ roomCode }) => {
        const roomDataOld = gameData[roomCode];
        roomDataOld.pressingEmergency += 1;
        if (roomDataOld.pressingEmergency >= 2) {
            io.to(roomCode).emit('emergency-over');
            io.to(`${roomCode}Sound`).emit('start-emergency-sound');
        }
        gameData[roomCode] = roomDataOld;
    });

    socket.on('stop-emergency-onRelease', ({ roomCode }) => {
        const roomDataOld = gameData[roomCode];
        roomDataOld.pressingEmergency -= 1;
        gameData[roomCode] = roomDataOld;
    });

    // task logic
    socket.on('view-scanner', ({ roomCode }, fn) => {
        const room = rooms[roomCode];
        const playerStats = getPlayerStatuses(room);
        fn({ playerStatus: playerStats });
    });

    socket.on('get-task-list', ({ roomCode, name }, fn) => {
        const room = rooms[roomCode];
        const taskList = getPlayerTasks(room, name);
        fn(taskList);
    });

    socket.on('start-task', ({ roomCode, name, taskID }) => {
        const room = rooms[roomCode];
        rooms[roomCode] = playerEnterTask(room, name, taskID);
    });

    socket.on('exit-task', ({ roomCode, name }) => {
        const room = rooms[roomCode];
        rooms[roomCode] = playerExitTask(room, name);
    });

    socket.on('finish-task', ({ roomCode, name, taskID }) => {
        logInfo(`${name} from ${roomCode} finished task: ${taskID}`);
        const roomOld = rooms[roomCode];
        const roomDataOld = gameData[roomCode];
        const { room, roomData } = playerFinishTask(
            roomOld,
            roomDataOld,
            name,
            taskID,
        );
        rooms[roomCode] = room;
        gameData[roomCode] = roomData;
        socket.emit('finished-task', { taskID: taskID });
        io.to(roomCode).emit('task-update', {
            tasksComplete: roomData.tasksComplete,
        });
        checkCrewWinTask(roomData) &&
            io.to(roomCode).emit('game-over', { winner: ROLE_CREW }) &&
            logInfo(`Game Over, Crew Won! Room: ${roomCode}`);
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

    socket.on('join-room-sound', ({ roomCode }) => {
        socket.join(`${roomCode}Sound`);
    });
});

server.listen(port, () => {
    logInfo(`listening on *:${port}`);
    logInfo(`open to requests from ${process.env.BASE_URL}`);
});
