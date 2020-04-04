
function get_geom(x) {

	var geom = {
		level: x.level,
		building: x.building,
		room: x.room,
		infections: x.infections,
		kind: x.kind,
		outline: x.outline,
	}

	return geom;
}




// MODULE EXPORTS ===================================================================

var d = {
	get_geom: function(x){ return get_geom(x) },
};


module.exports = d