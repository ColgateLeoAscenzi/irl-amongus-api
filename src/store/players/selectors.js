const getPlayers = (room) => {
    return room?.players;
};

const getPlayerNames = (room) => {
    const playerNames = [];
    for (let i = 0; i < room.players.length; i++) {
        playerNames.push(room.players[i].name);
    }
    return playerNames;
};

const getPlayerStatuses = (room) => {
    const playerStatuses = [];
    for (let i = 0; i < room.players.length; i++) {
        const name = room.players[i].name;
        const status = { name: name, isDead: room.playerData[name].isDead };
        playerStatuses.push(status);
    }
    return playerStatuses;
};

const getPlayerTasks = (room, name) => {
    return room.playerData[name].taskList;
};

module.exports = {
    getPlayers,
    getPlayerStatuses,
    getPlayerTasks,
    getPlayerNames,
};
