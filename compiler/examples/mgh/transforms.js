const Transform = require("../../src/Transform").Transform;

var mghTransform = new Transform(
    "SELECT * FROM geoms WHERE kind IN ('Room', 'Level');", 
    "mgh",
    "",
    [],
    true
);

var activitiesTransform = new Transform(
    "SELECT * FROM activities;", 
    "mgh",
    "",
    [],
    true
);

var peopleTransform = new Transform(
    "SELECT * FROM people;", 
    "mgh",
    "",
    [],
    true
);

var fakeTransform = new Transform(
    "SELECT * FROM fakerooms;", 
    "mgh",
    "",
    [],
    true
);


module.exports = {
    mghTransform,
    activitiesTransform,
    peopleTransform,
    fakeTransform
};
