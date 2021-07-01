const getMasterTaskObject = (taskList) => {
    const masterTaskObject = {};
    for (let i = 0; i < taskList.length; i++) {
        masterTaskObject[taskList[i].id] = {
            taskName: taskList[i].taskName,
            taskLoc: taskList[i].taskLoc,
            taskDesc: taskList[i].taskDesc,
            taskTotalParts: taskList[i].taskTotalParts,
        };
    }
    return masterTaskObject;
};

module.exports = {
    getMasterTaskObject,
};
