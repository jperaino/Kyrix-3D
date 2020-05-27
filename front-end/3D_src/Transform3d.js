const p = require('../js/properties.js')

transform_fns = {}

function Transform3d(id) {
	
	// assign fields
	this.id = String(id);

}


// var get_infected_rooms = function() {

// 	console.log("getting_infected_rooms");
// 	var predicate = "id=fake&predicate0="

// 	$.ajax({
//         type: "GET",
//         url: "/canvas",
//         data: predicate,
//         success: function(data) {
//         	x = JSON.parse(data).staticData[0]

//     		var infected_rooms = new Set();

//         	for (var i = 0; i < x.length; i++) {

//         		// console.log(x[i]['room'])
//         		infected_rooms.add(x[i]['room'])
//         	}

//         	infected_rooms = Array.from(infected_rooms)
//         	console.log(`(${infected_rooms.join()})`)

//         	// var next_predicate = "id=mgh&predicate0=((kind='Room')and(TO_NUMBER(level, '9999.99')<8))"
//         	var next_predicate = "id=mgh&predicate0=((kind='Room'))"

//         	temp_fn();
//         }
// 	})
// }


// transform_fns['get_infected_rooms'] = get_infected_rooms;
  
// exports
module.exports = {
	Transform3d,
	// transform_fns
}