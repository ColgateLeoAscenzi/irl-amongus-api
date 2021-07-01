const { taskEnterIDCode } = require('./common/taskEnterIDCode');
const { taskWires } = require('./common/taskWires');
const { taskMedbay } = require('./long/taskMedbay');
const { taskPadlock } = require('./long/taskPadlock');
const { taskStartFans } = require('./long/taskStartFans');
const { taskAlignTelescope } = require('./short/taskAlignTelescope');
const { taskBuyBeverage } = require('./short/taskBuyBeverage');
const { taskChartCourse } = require('./short/taskChartCourse');
const { taskDecontaminate } = require('./short/taskDecontaminate');
const { taskFuelEngines } = require('./short/taskFuelEngines');
const { taskMaze } = require('./short/taskMaze');
const { taskMeasureWeather } = require('./short/taskMeasureWeather');
const { taskPrimeShields } = require('./short/taskPrimeShields');
const { taskProcessData } = require('./short/taskProcessData');
const { taskRecordTemperature } = require('./short/taskRecordTemperature');
const { taskRefillO2 } = require('./short/taskRefillO2');
const { taskSortSamples } = require('./short/taskSortSamples');
const { taskMonitorTree } = require('./short/taskMonitorTree');
const { taskCleanO2Filter } = require('./short/taskCleanO2Filter');
const { taskAssembleArtifact } = require('./short/taskAssembleArtifact');

module.exports = {
    taskList: [
        taskAlignTelescope,
        taskAssembleArtifact,
        taskBuyBeverage,
        taskChartCourse,
        taskCleanO2Filter,
        taskDecontaminate,
        taskFuelEngines,
        taskMaze,
        taskMeasureWeather,
        taskPrimeShields,
        taskProcessData,
        taskRecordTemperature,
        taskRefillO2,
        taskSortSamples,
        taskMonitorTree,
        taskEnterIDCode,
        taskWires,
        taskMedbay,
        taskPadlock,
        taskStartFans,
    ],
    shortTasks: [
        taskAlignTelescope,
        taskAssembleArtifact,
        taskBuyBeverage,
        taskChartCourse,
        taskCleanO2Filter,
        taskDecontaminate,
        taskFuelEngines,
        taskMaze,
        taskMeasureWeather,
        taskPrimeShields,
        taskProcessData,
        taskRecordTemperature,
        taskRefillO2,
        taskSortSamples,
        taskMonitorTree,
    ],
    commonTasks: [taskEnterIDCode, taskWires],
    longTasks: [taskMedbay, taskPadlock, taskStartFans],
};
