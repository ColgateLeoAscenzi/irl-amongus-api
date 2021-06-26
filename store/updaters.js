
const addPlayer = (room, name, socketId) => {
    // add full player data
    room.players.push({
        id: socketId,
        name: name,
    });
    // update hashmap for checking
    room.playerNames[name] = true;

    return room;
}

module.exports = {
    addPlayer,
}
