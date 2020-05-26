

function Jump3d(id) {
	// assign fields
	this.id = String(id);
	this.update_level = true;
	this.nextCanvas = 'allBuildings';
}

// exports
module.exports = {
	Jump3d
}