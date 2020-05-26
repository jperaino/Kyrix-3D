
modes = {}



// Calls ===================================================================


function get_levels(){

	$.ajax({
		type: "GET",
		url: "/canvas",
		data: `id=mgh&predicate0=(kind='Level')`,
		success: function(data) {
			x = JSON.parse(data).staticData[0]

			for(var i = 0; i < x.length; i++) {
			}
		}
	})
}


function get_infected_levels(){

	$.ajax({
		type: "GET",
		url: "/canvas",
		data: `id=mgh&predicate0=(kind='Room')`,
		success: function(data) {

		}
	})
}


function whoops(t) {

	console.log("here")
	console.log(t);
	return ("whooooops")
}


function parse_levels(){
	x = JSON.parse(data).staticData[0]

	
}



function get_filtered_rooms(){


	levels = get_data(`id=mgh&predicate0=(kind='Level')`, (d) => {return d})

	console.log(levels)

}



// Backend Fetch ===================================================================

function get_data(predicate, callback) {

	$.ajax({
		type: "GET",
		url: "/canvas",
		data: predicate,
		success: function(data) {
			callback(data);
			// callback("hello hello hello");
		}
	})
}

// function get_level_data()

// Specifications ===================================================================

// Create the initial mode
modes['buildings'] = {

	button_label: 'All Buildings', // UI
	predicate: `id=mgh&predicate0=(kind='Level')`, // Layer
	clickable_kind: 'Level', // Layer
	ground_plane_on: true, // Layer
	visible_divs: [], // UI
	color_scale: null, // Rendering
	room_filter: null, // Layer
	level_opacity: 1, // Layer
	default_level: 999, // Layer
	room_condition: null, // 
	color_metric: null, // Rendering
	subtitle: 'Viewing all buildings', // UI
	results: get_data(`id=mgh&predicate0=(kind='Level')`, whoops) // Layer
}

// Create a mode to view infections across all levels
b_alt = modes['buildings'];
b_alt['button_label'] = 'All Buidlings - Infections'
b_alt['subtitle'] = 'Viewing all buildings with infections'
// b_alt['level_scores'] = get_level_scores();

modes['buildings_infections_by_level'] = b_alt


// Create a mode to view each level with infected rooms
modes['rooms_by_level_infections'] = {

	button_label: 'Rooms by Level - Infections',
	clickable_kind: 'Room',
	ground_plane_on: false,
	visible_divs: [],
	color_scale: null,
	room_filter: null, 
	level_opacity: 0.075,
	default_level: 8,
	room_condition: "level='8'",
	color_metric: 'infections',
	color_metric_max: 6,
	subtitle: 'Viewing rooms'

}

modes['infected_rooms'] = {

	button_label: 'All Infected Rooms',
	clickable_kind: 'Room',
	ground_plane_on: false,
	visible_divs: [],
	color_scale: null,
	room_filter: null, 
	level_opacity: 0.075,
	default_level: 9999,
	room_condition: "infections>'0'", //"level='8'",
	color_metric: 'infections',
	color_metric_max: 6,
	subtitle: 'Viewing rooms'

}



var infected_room_filter = {
	level: null,
	room_name: null,
	building: null,
	infections: ">'0'"
}



module.exports = modes










