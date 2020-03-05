const Transform = require("../../src/Transform").Transform;

var mghTransform = new Transform(
    "SELECT * FROM geoms WHERE kind = 'Level';",
    "mgh",
    "",
    [],
    true
);

module.exports = {
    mghTransform
};
