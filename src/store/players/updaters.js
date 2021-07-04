const { prepTasksForPlayer } = require('./utils');
const { generateRandomSubarray } = require('./utils');
const { ROLE_CREW } = require('./consts');

const addPlayer = (room, name, socketId) => {
    // add full player data
    room.players.push({
        id: socketId,
        name: name,
    });
    // update hashmap for checking
    room.playerNames[name] = true;
    room.playerData[name] = {
        role: ROLE_CREW,
        isDead: false,
        doingTask: false,
        currentTask: '-1',
        taskList: {},
        votes: 0,
    };
    return room;
};

const killPlayer = (room, roomData, name) => {
    room.playerData[name].isDead = true;
    if (room.playerData[name].role === ROLE_CREW) {
        roomData.crewAlive -= 1;
    } else {
        roomData.impostersAlive -= 1;
    }
    return { room: room, roomData: roomData };
};

const playerSetInitialTasks = (room, roomData, name) => {
    // randomly selects a certain number of tasks and slices an array
    const commonTasks = [];
    commonTasks.push(roomData.commonTasks[roomData.selectedCommonTask]);
    const shortTasks = generateRandomSubarray(
        roomData.shortTasks,
        roomData.numShortTasks,
    );
    const longTasks = generateRandomSubarray(
        roomData.longTasks,
        roomData.numLongTasks,
    );

    // converts the arrays to objects the player has that can be indexed by Id
    const taskList = prepTasksForPlayer(commonTasks, shortTasks, longTasks);

    return taskList;
};

const playerEnterTask = (room, name, taskID) => {
    room.playerData[name].doingTask = true;
    room.playerData[name].currentTask = taskID;
    return room;
};

const playerExitTask = (room, name) => {
    room.playerData[name].doingTask = false;
    room.playerData[name].currentTask = '-1';
    return room;
};

const playerFinishTask = (room, roomData, name, taskID) => {
    room.playerData[name].doingTask = false;
    room.playerData[name].currentTask = '-1';

    const task = room.playerData[name].taskList[taskID];
    if(!(task.completed)){
        task.completed = true;
        room.playerData[name].taskList[taskID] = task;

        roomData.tasksComplete += 1;
    }

    return { room: room, roomData: roomData };
};

module.exports = {
    addPlayer,
    killPlayer,
    playerEnterTask,
    playerExitTask,
    playerFinishTask,
    playerSetInitialTasks,
};
