const {ROLE_CREW} = require('./consts');

const addPlayer = (room, name, socketId) => {
    // add full player data
    room.players.push({
        id: socketId,
        name: name,
    });
    // update hashmap for checking
    room.playerNames[name] = true;
    room.playerData[name] = {
        role: '',
        isDead: false,
        doingTask: false,
        currentTask: -1,
        taskList: [],
    }
    return room;
}

const killPlayer = (room, roomData, name) => {
    room.playerData[name].isDead = true;
    if(room.playerData[name].role === ROLE_CREW) {
        roomData.crewAlive -= 1;
    }
    else {
        roomData.impostersAlive -= 1;
    }
    return {room: room, roomData: roomData};
}

module.exports = {
    addPlayer,
    killPlayer,
}
