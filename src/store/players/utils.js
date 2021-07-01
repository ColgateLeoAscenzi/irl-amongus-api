const checkImposterWinKill = (roomData) => {
    return roomData.impostersAlive === roomData.crewAlive;
};

const checkCrewWinTask = (roomData) => {
    return roomData.tasksComplete === roomData.totalTasks;
};

const generateRandomSubarray = (array, len) => {
    const shuffled = shuffle(array);
    return shuffled.slice(0, len);
};

/**
 * Shuffles array in place.
 * @param {Array} a items An array containing the items.
 */
function shuffle(a) {
    let j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

const prepTasksForPlayer = (commonTasks, shortTasks, longTasks) => {
    const tasksObject = {};
    const taskArray = commonTasks.concat(shortTasks).concat(longTasks);
    for (let i = 0; i < taskArray.length; i++) {
        const currentTask = taskArray[i];
        tasksObject[currentTask.id] = {
            taskName: currentTask.taskName,
            taskLoc: currentTask.taskLoc,
            taskDesc: currentTask.taskDesc,
            taskCurrentPart: 1,
            taskTotalParts: currentTask.taskTotalParts,
            taskComplete: false,
        };
    }
    return tasksObject;
};

module.exports = {
    checkImposterWinKill,
    checkCrewWinTask,
    generateRandomSubarray,
    prepTasksForPlayer,
};
