const Transform = require("../../src/Transform").Transform;

var mghTransform = new Transform(
    "select * from geometries;",
    "mgh",
    "",
    [],
    true
);

module.exports = {
    mghTransform
};
