const task18ID = 18;
const task18Name = 'Start Fans';
const task18Loc = 'Located in Ventilation';
const task18Desc = 'Enter Ventilation from Cargo Bay and use the panel. They must then click "Reveal Code", which causes a code made up of coin, diamond, emerald and ruby icons to appear. The player must close the window and enter Ventilation from Showers, then enter the code provided from the first panel';
const task18TotalParts = 1;

const taskStartFans = {
    id: task18ID,
    taskName: task18Name,
    taskLoc: task18Loc,
    taskDesc: task18Desc,
    taskTotalParts: task18TotalParts,
};

module.exports = {
    taskStartFans,
};
