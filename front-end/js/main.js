console.log("Loaded main.js");

// REQUIREMENTS ===================================================================
const THREE = require('three');
const OrbitControls = require('three-orbitcontrols');
const STLLoader = require('three-stl-loader')(THREE);
const d3 = require('d3');


// PROPERTIES ===================================================================

// State properties
var mode = 'buildings'
var cur_levels = [];

// Three.js Lists
var level_uuids = [];
var room_uuids = [];
var building_uuids = [];
var infected_uuids = [];
var patient_uuids = [];
var ground_plane_uuid = null;

// D3 Lists
var activities = [];
var people = [];
var person_room_uuids = {};

// Listener Helpers
var mouse_down_intersected;

// Colors
var colors = {
	'background': new THREE.Color( 0xffffff ),
	'selected_hex': 0x0000FF
};

// Raycasting
var raycasting_targets = [];


// MODE HANDLING ===================================================================

function set_mode(new_mode, level=null) {
	/* Given a string containing a new mode, performs update functions to toggle mode */
	console.log(`Changing mode to ${new_mode}`)

	switch(new_mode){
		case 'buildings':
			mode_to_all_buildings();
			set_raycaster_targets(level_uuids);
			break;
		case 'level':
			mode_to_level(level);
			break;
		case 'infections':
			mode_to_infections();
			set_raycaster_targets(infected_uuids);
			break;
		case 'people':
			mode_to_people();
			set_raycaster_targets(patient_uuids);
			break;
		default:
			console.log(`ERROR! No mode called ${new_mode}`)
	}
}


function toggle_ground_plane(b) {

	const ground_plane = scene.getObjectByProperty('uuid', ground_plane_uuid);

	if (b) {
		tweenOpacity(ground_plane, 1, 400);
	} else {
		tweenOpacity(ground_plane, 0, 400);
	}
}


function mode_to_all_buildings() {
	/* Performs actions to set the mode to 'buildings' */
	mode = 'buildings'

	// Archive
	destroyEverything()
	set_level([]);
	$("#level-label").text(`Showing all levels`)

	$.each(uuids, function(k, v) {
		const object = scene.getObjectByProperty('uuid', k);
		tweenOpacity(object, 1, 400);
	})

	toggle_ground_plane(true);
}


function mode_to_level(level) {
	/* Performs actions to set the mode to 'level' */
	mode = 'level'
	set_level(level);

	toggle_ground_plane(false);
}


function mode_to_infections() {
	/* Performs actions to set the mode to 'infections' */
	mode = 'infections'

	// Archive
	$("#room_body").empty();
	// set_mode('infections')

	console.log("Viewing infected rooms");
	$("#level-label").text(`Showing infected rooms.`)

	tweenCamera(camera, [12605, 4603, 14960], 1500, target=[17725, 0, 12565])

	set_level(25)

	toggle_ground_plane(false);

	$.each(rooms, function(k,v) {
		if (v['infections'] > 0) {
			loadGeomFromOutline(v)

			$("#room_body").append(
				`<tr id='${v.room}'><th scope='row'>${v.room}</th><td>${v.building}</td><td>${v.level}</td><td>${v.infections}</td></tr>`
				)
		}
	})

	set_raycaster_targets(infected_uuids);
}




function mode_to_people() {
	/* Performs actions to set the mode to 'people' */
	mode = 'people';

	// Show the window
	document.getElementById("people").style.display = "block";
	set_level(25);
	toggle_ground_plane(false);

	// Add rows
	d3.select('#people_body')
		.selectAll('tr')
		.data(people)
		.join('tr')
			.html(d => `<th scope='row'>${d.id}</th><th scope='row'>${d.role}</th><td>${d.infected}</td>`)
		.attr("class", "person_row")
		.on("click", d => {
			onPersonClick(d);
		})

	// Create a selection of rooms that the person has visited
	console.log(`Rooms Length (pre-filter): ${rooms.length}`)
	filtered_rooms = rooms.filter( (d) => {
		return (d.room === '818');
	})
	console.log(`Rooms Length (post-filter): ${filtered_rooms.length}`)
}


function onPersonClick(person){
	/* Performs an action when a person is selected*/
	console.log(person)

	// Get activities for person
	cur_activities = activities.filter( (dd) => {
		return (dd.person_id === person.id)
	})

	// Get rooms for activities
	var room_set = new Set();
	$.each(cur_activities, (k,v) => {
		room_set.add(v.room)
	})
	room_array = Array.from(room_set);

	// Create room data
	var cur_rooms = rooms.filter((dd) => {
		return room_array.includes(dd.room); 
	})

	// Create rooms
	updatePersonRooms(cur_rooms);

}

function updatePersonRooms(data) {
	/* Given a list of current rooms, adds or removes geometries from the scene */

	console.log(data);

	destroyEverything();

	$.each(data, (k, v) => {
		loadPersonGeomFromOutline(v)
	})

	// d3.select("#dummy-container")
	// 	.selectAll('dummy')
	// 	.data(data)
	// 	.join(
	// 		enter => enter.append("dummy")
	// 			.html(d => `${d.room}`)
	// 			.call(d => {

	// 				dd = d._groups[0];
	// 				// console.log(dd)
	// 				$.each(dd, (k, v) => {
	// 					try {
	// 						k_obj = v.__data__;
	// 						loadPersonGeomFromOutline(k_obj);
							
	// 					} catch {
	// 					}
	// 				}) 
	// 			}),
	// 		update => update,
	// 		exit => exit.remove()
	// 			.call(d => {
	// 				dd = d._groups[0];
	// 				$.each(dd, (k, v) => {
	// 					try{
	// 						cur_uuid = person_room_uuids[v.__data__.room]
	// 						const object = scene.getObjectByProperty('uuid', cur_uuid);
	// 						object.geometry.dispose();
	// 						object.material.dispose();
	// 						scene.remove(object);
	// 						delete person_room_uuids[v.room];
	// 					} catch {}
	// 				})
	// 			})
	// 	)
}



function loadPersonGeomFromOutline(k_obj) {

	console.log("here")

	vertices = []
	raw_vertices = JSON.parse(k_obj["outline"])["vertices"]

	$.each(raw_vertices, function(k, v) {
		vertices.push(new THREE.Vector2(v.x, v.y))
	})

	var shape = new THREE.Shape(vertices);
	shape.autoClose = true; 

	color = d3.interpolateOrRd(.5)

	var depth = 120
	var material = new THREE.MeshPhongMaterial( { color: color, specular: 0x111111, shininess: 0, flatShading: false, transparent: false, opacity: 0} );

	var extrudeSettings = {depth: depth, bevelEnabled: false};
	var geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

	var mesh = new THREE.Mesh(geometry, material)

	mesh.position.set( 0, k_obj.level * 120, 0 );
	mesh.rotation.set( - Math.PI / 2, 0, - Math.PI / 2 );
	mesh.scale.set( 1, 1, 1 );

	mesh.castShadow = false;
	mesh.receiveShadow = false;

	scene.add( mesh );

	// uuids.push(mesh.uuid)
	uuids[mesh.uuid] = k_obj

	// person_room_uuids[k_obj.room] = mesh.uuid;

}



// Properties ===================================================================
var objects = []
var uuids = {}

var building_k_objs = [];
var level_fps = [];
var level_k_objs = [];
var room_fps = [];
var room_k_objs = [];
var visible_rooms = [];

var camera, controls, scene, renderer, raycaster;
var mouse = new THREE.Vector2(), INTERSECTED;
var radius = 100, theta = 0;

var level_objs = [];
var rooms = [];

var cur_level = 25;

var visited_rooms = ['818', '509', '530J', '568', 'G01', '104']

// UPDATE METHODS ===================================================================

function set_level(x) {

	// If no levels are provided, set the level to 26
	if (x === []) {
		x = 26;
	}

	int_x = parseInt(x)
	str_x = `${int_x}`

	console.log(`Updating level to: ${str_x}`)
	cur_level = int_x;
	updateObjectOpacities(cur_level) 
	get_rooms_from_level(cur_level);

	$("#level-label").text(`Current Level: ${str_x}`)


}


// Listener Methods ===================================================================

document.onkeydown = checkKey;

function checkKey(e) {

	if (e['key'] === "ArrowUp") {
		console.log("ARROW UP")
		console.log(cur_level + 1);
		set_mode('level', level=cur_level + 1)
	} else if (e['key'] === "ArrowDown") {
		console.log("ARROW DOWN")
		// console.log(cur_level -1);
		set_mode('level', level=cur_level - 1)
	}
}


// THREE.JS Init ===================================================================

function init_three_js() {
	/* Initializes three.js */

	// Scene
	scene = new THREE.Scene();
	scene.background = colors.background;

	// Renderer
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.VSMShadowMap;
	renderer.setClearColor( 0xCCCCCC, 1 );
	document.body.appendChild( renderer.domElement );

	// Camera
	camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 50000 );
	camera.position.set( 10706, 5203, 15119 );

	// Orbit Controls
	controls = new OrbitControls( camera, renderer.domElement );
	controls.enableDamping = true; 
	controls.dampingFactor = 0.05;
	controls.screenSpacePanning = false;
	controls.minDistance = 100;
	controls.maxDistance = 40000;
	controls.maxPolarAngle = Math.PI / 2;
	controls.easing = true;
	controls.target.set(18022,0,12510)

	// Raycasting
	raycaster = new THREE.Raycaster();
	document.addEventListener( 'mousemove', onDocumentMouseMove, false );
	document.addEventListener( 'mousedown', onDocumentMouseDown, false );
	document.addEventListener( 'click', onDocumentMouseClick, false);
	document.addEventListener( 'mousedown', viewPeople, false);

	// Lights
	var light = new THREE.DirectionalLight( 0xffffff );
	light.position.set( 100, 100, 100 );
	light.intensity = 0.1
	// light.castShadow = true;
	scene.add( light );

	var light = new THREE.DirectionalLight( 0xffffff );
	light.position.set( 23584, 6652, 4096 );
	// light.castShadow = true;
	light.intensity = 0.1
	scene.add( light );

	var light = new THREE.AmbientLight( 0xffffff );
	// light.castShadow = true;
	light.intensity = 0.3;
	scene.add( light );

	// Fog
	scene.fog = new THREE.Fog(0xffffff, 5000, 50000);


	// Window resize listener
	window.addEventListener( 'resize', onWindowResize, false );

	// Load Ground Plane
	loadGroundPlane();


	var dirLight = new THREE.DirectionalLight( 0xFFFFFF, 1 );
					dirLight.name = 'Dir. Light';
					// dirLight.position.set( 10000, 15000, 17000 );
					dirLight.position.set(8356, 8807, 20395);
					dirLight.target.position.set(16487, 0, 14371);
					dirLight.castShadow = true;
					dirLight.shadow.camera.near = 0.1;
					dirLight.shadow.camera.far = 50000;
					dirLight.shadow.camera.right = 20000;
					dirLight.shadow.camera.left = - 10000;
					dirLight.shadow.camera.top	= 20000;
					dirLight.shadow.camera.bottom = - 30000;
					dirLight.shadow.mapSize.width = 512*4;
					dirLight.shadow.mapSize.height = 512*4;
					dirLight.shadow.radius = 2;
					dirLight.shadow.bias = -0.0001;
					dirLight.intensity = 0.75;
					scene.add( dirLight );
					scene.add( dirLight.target );

	// var shadowHelper = new THREE.CameraHelper( dirLight.shadow.camera );
	// scene.add( shadowHelper );	

}


function animate() {
	/* Required three.js animate() function */

	requestAnimationFrame(animate);
	controls.update();
	TWEEN.update();
	updateCameraLabels(camera, controls)
	render();
}


function set_raycaster_targets(uuids, empty_list=true){
	// console.log(`Setting raycaster targets for ${uuids}`);

	if (empty_list) {
		raycasting_targets = [];
	}

	children = scene.children;
	temp_children = [];
	$.each(children, function(k,v){
		if (uuids.includes(v.uuid)){
			temp_children.push(v);
		}
	});

	raycasting_targets = temp_children;
}



function render() {

	// Find Raycasting Intersections
	raycaster.setFromCamera(mouse, camera);

	var intersects = raycaster.intersectObjects(raycasting_targets);

	if ( intersects.length > 0 ) {
		if ( INTERSECTED != intersects[ 0 ].object ) {
			if ( INTERSECTED ) {
				INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
			}
			INTERSECTED = intersects[ 0 ].object;
			INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
			INTERSECTED.material.emissive.setHex( colors.selected_hex );
			$("#highlighted-info").empty();

			cur_k_obj = uuids[INTERSECTED.uuid];

			console.log(cur_k_obj)
			room_name = cur_k_obj['room']
			building_name = cur_k_obj['building']
			floor_name = cur_k_obj['level']
			infections = cur_k_obj['infections']


			if (mode !== 'infections') {
				$("#room_body").empty();
				$("#room_body").append(
					`<tr><th scope='row'>${room_name}</th><td>${building_name}</td><td>${floor_name}</td><td>${infections}</td></tr>`
					)
			} else {
				console.log(INTERSECTED)
				console.log(INTERSECTED.uuid)
				$(`#${room_name}`).addClass('table-danger')
			}
		}


	} else {
		if ( INTERSECTED ) {
			INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex )
			if (mode !== 'infections') {
				$("#highlighted-info").empty();
				$("#room_body").empty();
			} else {
				cur_k_obj = uuids[INTERSECTED.uuid];
				room_name = cur_k_obj['room'];
				$(`#${room_name}`).removeClass('table-danger')
			}
		};
		INTERSECTED = null;

	}

	renderer.render( scene, camera );
}


function onDocumentMouseMove(event){
	/* Updates mouse x and y coordinates for three.js raycasting */
	event.preventDefault();
	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}


function onDocumentMouseDown(event){
	/* Saves the identity of the object that the mouse was over when it is clicked
	in order to verify that mouse click event is over same object. */

	event.preventDefault();
	raycaster.setFromCamera(mouse, camera);
	var intersects = raycaster.intersectObjects(raycasting_targets);

	if (intersects.length > 0) {
		INTERSECTED = intersects[0].object
		mouse_down_intersected = INTERSECTED;
	}
}


function onDocumentMouseClick(event){
	/* Handles mouse click events for three.js raycasting */
	event.preventDefault();
	raycaster.setFromCamera(mouse, camera);
	var intersects = raycaster.intersectObjects(raycasting_targets);

	if (intersects.length > 0) {
		INTERSECTED = intersects[0].object

		// Check if intersected object is same one when mouse clicked down.
		if (INTERSECTED === mouse_down_intersected) {

			if (mode !== 'infections') {
				onGeometryClick(INTERSECTED.uuid)
			} else {
				// onDetailRoomClick(INTERSECTED.uuid)
				console.log("not infections")
				// viewPeople();
			}
		}
	}
}


function onGeometryClick(uuid) {
	/* Performs actions to be performed when a geometry is clicked */
	console.log(uuid)
	k_obj = uuids[uuid]
	building = k_obj['building']
	level = k_obj['level']
	room = k_obj['room']
	
	text = `Building: ${building} | Level: ${level} | Room: ${room}`

	$("#lower-console").text(text) 

	viewRoomsFromLevel(k_obj);
	mode_to_level(uuids[uuid]['level'])
}


function onWindowResize() {
	/* Update rendera and camera on window resize */
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}


// THREE.JS Methods ===================================================================

function pickColor(k_obj) {
    kind = k_obj['kind'];

    if (kind === 'Level') {
    	return d3.interpolateOrRd(0);
    	
    } else {
    	number = k_obj.infections;
    	return d3.interpolateOrRd(number/5 *.8);
    }
}

function loadGroundPlane() {

	var geometry = new THREE.PlaneGeometry( 200000, 200000, 32 );
	geometry.rotateX( - Math.PI / 2);
	color = d3.interpolateOrRd(0)
	var material = new THREE.MeshPhongMaterial( { color: color, specular: color, shininess: 0, flatShading: false, transparent: true, opacity: 1} );


	var plane = new THREE.Mesh( geometry, material );
	plane.receiveShadow = true;

	plane.position.y += 120;
	scene.add( plane );

	ground_plane_uuid = plane.uuid;

}


function loadGeomFromOutline(k_obj) {

	vertices = []
	raw_vertices = JSON.parse(k_obj["outline"])["vertices"]

	$.each(raw_vertices, function(k, v) {
		vertices.push(new THREE.Vector2(v.x, v.y))
	})

	var shape = new THREE.Shape(vertices);
	shape.autoClose = true; 

	color = pickColor(k_obj);
	// console.log(color)

	var depth = 110
	var material = new THREE.MeshPhongMaterial( { color: color, specular: 0x111111, shininess: 0, flatShading: false, transparent: true, opacity: 0} );


	if (k_obj.kind === 'Room') {
		console.log("room depth")
		depth = 120;
		material.transparent = false;
	}


	var extrudeSettings = {depth: depth, bevelEnabled: false};
	var geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

	
	var mesh = new THREE.Mesh(geometry, material)

	mesh.position.set( 0, k_obj.level * 120, 0 );
	mesh.rotation.set( - Math.PI / 2, 0, - Math.PI / 2 );
	mesh.scale.set( 1, 1, 1 );

	mesh.castShadow = false;
	mesh.receiveShadow = true;

	scene.add( mesh );
	uuids[mesh.uuid] = k_obj;


	if (k_obj.kind === 'Level') {
		level_uuids.push(mesh.uuid)
	} else if (k_obj.kind === 'Room') {
		room_uuids.push(mesh.uuid)
	}

	if (mode == 'infections') {
		mesh.receiveShadow = false;
		infected_uuids.push(mesh.uuid)
	} 

	tweenOpacity(mesh, 1, 1000);

}


function destroyEverything(){
	/* Destroy and dispose all objects in objects */
	console.log("Destroy Everything")
	
	$.each(uuids, function (k, v) {
		if (v['kind'] == 'Room') {
			const object = scene.getObjectByProperty('uuid', k);
			object.geometry.dispose();
			object.material.dispose();
			scene.remove(object);
			delete uuids[k];
		}	
	});
}


function tweenCamera(camera, position, duration, target=null) {
	/* Tweens the camera to a new position */

	new TWEEN.Tween(camera.position).to({
		x:position[0],
		y:position[1],
		z:position[2]
	}, duration)
	.easing(TWEEN.Easing.Quadratic.InOut)
	.start();

	if (target !== null) {
		new TWEEN.Tween(camera.target).to({
			x:target[0],
			y:target[1],
			z:target[2]
		}, duration)
		.easing(TWEEN.Easing.Quadratic.InOut)
		.start();
	}
}


function tweenOpacity(object, new_opacity, duration) {

	new TWEEN.Tween(object.material).to({
		opacity: new_opacity,
	}, duration)
	.easing(TWEEN.Easing.Quadratic.InOut)
	.start();

	if (new_opacity > 0.5) {
		object.castShadow = true;	
	} else {
		object.castShadow = false;
	}

}


function updateObjectOpacities() {
	/*Given a uuid, fades all other objects of that type in the scene */
	destroyEverything()

	$.each(uuids, function (k, v) {
		test_level = v['level']

		if (test_level > cur_level - 1) {
			visible = false;
			new_opacity = 1;
			castShadow = true;
		} else {
			visible = true;
			// new_opacity = 0.125;
			new_opacity = 0.075;
			castShadow = false;
		}

		const object = scene.getObjectByProperty('uuid', k);
		object.visible = visible;
		object.castShadow = castShadow;
		tweenOpacity(object, new_opacity, 400);
	});
}


function get_rooms_from_level(level){
	console.log(`Getting rooms from level ${level}`)

	room_uuids = [];
	$.each(rooms, function(k,v) {
		if (v['level'] === `${level}`) {
			loadGeomFromOutline(v)
		}
	})

	// Update the scene objects that the raycaster will find
	set_raycaster_targets(room_uuids);
}


function viewRoomsFromLevel(level_obj) {
	console.log("View Rooms from Level")

	var level = level_obj.level;
	var building = level_obj.building;
	var visible_rooms = [];

	console.log(level)
	console.log(building)

	for (room in room_k_objs) {
		console.log(room['level'])
		if (room['level'] === level) {
			if (room['building'] === building) {
				console.log(room);
			}
		}
	}
}


// UI Methods ===================================================================

function updateCameraLabels(camera, controls) {
	/* Updates UI labels with camera position and target location */

	var cx = camera.position.x.toFixed(0)
	var cy = camera.position.y.toFixed(0)
	var cz = camera.position.z.toFixed(0)

	var lx = controls.target.x.toFixed(0)
	var ly = controls.target.y.toFixed(0)
	var lz = controls.target.z.toFixed(0)

	$("#camera-pos").text(`Camera: x: ${cx}, y: ${cy}, z: ${cz}`);
	$("#camera-look").text(`Tartget: x: ${lx}, y: ${ly}, z: ${lz}`);
}


// PostgreSQL Methods ===================================================================


function objectFromPSQL(data) {
	/* Creates an object from a row of PSQL data */

	var object = {
		level: data.level,
		building: data.building,
		room: data.room,
		stl_fp: data.stl_fp,
		infections: data.infections,
		kind: data.kind,
		outline: data.outline
	}

	return object
}


function activityFromPSQL(data) {
	/* Creates an object from a row of PSQL data */

	var activity = {
		id: data.id,
		room: data.room,
		person_id: data.person_id,
		date: data.timestamp
	}

	return activity
}


function personFromPSQL(data) {
	/* Creates an object from a row of PSQL data */

	var person = {
		id: data.id,
		infected: data.infected,
		role: data.role
	}

	return person
}


function load_all_from_psql() {
	/* Sends a http request to the kyrix backend and loads level geometries. 
	Populates a list of level objects and room objects. */

	$.ajax({
        type: "GET",
        url: "/canvas",
        data: "id=mgh&predicate0=&predicate1=&predicate2=",
        success: function(data) {
        	x = JSON.parse(data).staticData[0]

            for (var i = 0; i < x.length; i++) {
			    obj = objectFromPSQL(x[i])

				if (obj.kind === 'Level') {
					level_objs.push(obj)
					loadGeomFromOutline(obj)

				} else if (obj.kind === 'Room') {
					rooms.push(obj)
				}
			}

			set_mode('buildings')
        }
    });
}


function load_activities() {
	/* Sends a http request to the kyrix backend and loads level geometries. 
	Populates a list of level objects and room objects. */

	$.ajax({
        type: "GET",
        url: "/canvas",
        data: "id=activities&predicate0=&predicate1=&predicate2=",
        success: function(data) {
        	x = JSON.parse(data).staticData[0]

        	$.each(x, function(k, v) {
        		activity = activityFromPSQL(v)
        		activities.push(activity)
        	})
        }
    });
}


function load_people() {
	/* Sends a http request to the kyrix backend and loads level geometries. 
	Populates a list of level objects and room objects. */

	$.ajax({
        type: "GET",
        url: "/canvas",
        data: "id=people&predicate0=&predicate1=&predicate2=",
        success: function(data) {
        	x = JSON.parse(data).staticData[0]

        	$.each(x, function(k, v) {
        		person = personFromPSQL(v)
        		people.push(person)
        	})

        	console.log(people)
        }
    });
}

// CAMERA UPDATES ===================================================================

function viewPlan() {
	$("#room_body").empty();
	set_mode('plan')

	tweenCamera(camera, [16855, 13387, 13703], 1500, target=[16855, 0, 13703], )
	mode_to_level(8);
}


// Main Functions ===================================================================

function init() {

	init_three_js();
	load_activities();
	load_people();
	load_all_from_psql();
	$("#infectedRooms").click(function() {set_mode('infections')} );
	$("#viewPlan").click(viewPlan);
	$("#viewBuildings").click(function() {set_mode('buildings')} );
	$("#viewPeople").click(function() {set_mode('people')} );

}


// MAIN ===================================================================

init();
animate();



