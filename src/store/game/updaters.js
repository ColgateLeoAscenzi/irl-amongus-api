const startGame = (roomData) => {
    roomData.inProgress = true;
    return roomData;
};

module.exports = {
    startGame,
};
