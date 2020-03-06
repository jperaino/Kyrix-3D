const Transform = require("../../src/Transform").Transform;

var mghTransform = new Transform(
    // "SELECT * FROM geoms WHERE kind = 'Room';", 
    "SELECT * FROM geoms WHERE kind IN ('Room', 'Level');", 
    "mgh",
    "",
    [],
    true
);

module.exports = {
    mghTransform
};
