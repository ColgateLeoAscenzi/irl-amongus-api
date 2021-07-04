const task12ID = 12;
const task12Name = 'Fuel Engines';
const task12Loc = 'Two part task. Located in Storage and Upper Engine/Outside and Lower Engine/Outside';
const task12Desc = 'Fill the gas by holding the silver button to the right of the can. Then, go to Upper Engine to fuel by holding the silver button. Go back to the refuel station to refuel the can. Finally, go to the second location, Lower Engine, to fuel.';
const task12TotalParts = 1;

const taskFuelEngines = {
    id: task12ID,
    taskName: task12Name,
    taskLoc: task12Loc,
    taskDesc: task12Desc,
    taskTotalParts: task12TotalParts,
};

module.exports = {
    taskFuelEngines,
};
