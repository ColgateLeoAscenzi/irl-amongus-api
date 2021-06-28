const getPlayers = (room) => {
    return room?.players
}

const getPlayerStatuses = (room) => {
    const playerStatuses = [];
    for(let i = 0; i < room.players.length; i++){
        const name = room.players[i].name;
        const status = {name: name, isDead: room.playerData[name]}
        playerStatuses.push(status);
    }
    return playerStatuses;
}

module.exports = {
    getPlayers,
    getPlayerStatuses,
}