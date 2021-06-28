const checkImposterWinKill = (roomData) => {
    return roomData.impostersAlive === roomData.crewAlive;
}


module.exports = {
    checkImposterWinKill,
}
