// main.js 

const THREE = require('three')
const OrbitControls = require('three-orbitcontrols')
const STLLoader = require('three-stl-loader')(THREE)

// Properties ===================================================================
console.log("Loaded main.js today")

// var csv_file_path = '../data/Kyrix_Trial_200211.csv'

var current_zoom = "building"

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
var room_objs = [];

var cur_level = 25;

// UPDATE METHODS ===================================================================

function set_level(x) {

	int_x = parseInt(x)
	str_x = `${int_x}`

	console.log(`Updating level to: ${str_x}`)
	cur_level = int_x;
	updateObjectOpacities(cur_level) 
	get_rooms_from_level(cur_level);

	$("#level-label").text(`Current Level: ${str_x}`)
}


// Listener Methods ===================================================================

$(".layer-toggle").on("change", function(){
	switchToLayer(this.dataset.layer)
})


document.onkeydown = checkKey;

function checkKey(e) {

	if (e['key'] === "ArrowUp") {
		console.log("ARROW UP")
		console.log(cur_level + 1);
		set_level(cur_level + 1);
	} else if (e['key'] === "ArrowDown") {
		console.log("ARROW DOWN")
		console.log(cur_level -1);
		set_level(cur_level - 1);

	}

	console.log(e)
}



// THREE.JS Init ===================================================================

function init_three_js() {
	/* Initializes three.js */

	// Scene
	scene = new THREE.Scene();
	scene.background = new THREE.Color( 0xEEEEEE );

	// Renderer
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
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
	document.addEventListener( 'click', onDocumentMouseClick, false);

	// Lights
	var light = new THREE.DirectionalLight( 0xFAEBD7 );
	light.position.set( 100, 100, 100 );
	scene.add( light );

	var light = new THREE.DirectionalLight( 0xffffff );
	light.position.set( - 1, - 1, - 1 );
	scene.add( light );

	var light = new THREE.AmbientLight( 0x222222 );
	scene.add( light );

	// Window resize listener
	window.addEventListener( 'resize', onWindowResize, false );

}


function animate() {
	/* Required three.js animate() function */

	requestAnimationFrame(animate);
	controls.update();
	TWEEN.update();
	updateCameraLabels(camera, controls)
	render();
}


function render() {

	// Find Raycasting Intersections
	raycaster.setFromCamera(mouse, camera);
	var intersects = raycaster.intersectObjects(scene.children);
	if ( intersects.length > 0 ) {
		if ( INTERSECTED != intersects[ 0 ].object ) {
			if ( INTERSECTED ) {
				INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
			}
			INTERSECTED = intersects[ 0 ].object;
			INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
			INTERSECTED.material.emissive.setHex( 0x0000FF );
		}

	} else {
		if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
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


function onDocumentMouseClick(event){
	/* Handles mouse click events for three.js raycasting */
	event.preventDefault();
	raycaster.setFromCamera(mouse, camera);
	var intersects = raycaster.intersectObjects(scene.children);

	if (intersects.length > 0) {
		INTERSECTED = intersects[0].object
		onGeometryClick(INTERSECTED.uuid)
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
	set_level(uuids[uuid]['level'])
	// updateObjectOpacities(uuid)
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
    // console.log(kind);

    if (kind === 'Level') {
    	return d3.interpolateOrRd(0);
    	
    } else {
    	number = Math.random();
    	if (number > 0.99) {
    		return d3.interpolateOrRd(1);
    	} else {
    		return d3.interpolateOrRd(0);
    	}
    	
    }
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

	var extrudeSettings = {depth: 120, bevelEnabled: false};
	var geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
	var material = new THREE.MeshPhongMaterial( { color: color, specular: 0x111111, shininess: 0, flatShading: false, transparent: true, opacity: 1} );
	var mesh = new THREE.Mesh(geometry, material)

	mesh.position.set( 0, k_obj.level * 120, 0 );
	mesh.rotation.set( - Math.PI / 2, 0, - Math.PI / 2 );
	mesh.scale.set( 1, 1, 1 );

	mesh.castShadow = true;
	mesh.receiveShadow = true;

	scene.add( mesh );
	uuids[mesh.uuid] = k_obj;


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


function tweenCamera(camera, position, duration) {
	/* Tweens the camera to a new position */

	new TWEEN.Tween(camera.position).to({
		x:position[0],
		y:position[1],
		z:position[2]
	}, duration)
	.easing(TWEEN.Easing.Quadratic.InOut)
	.start();
}


function tweenOpacity(object, new_opacity, duration) {

	new TWEEN.Tween(object.material).to({
		opacity: new_opacity,
	}, duration)
	.easing(TWEEN.Easing.Quadratic.InOut)
	.start();
}


function switchToLayer(layer) {
	current_zoom = layer;
	// console.log(layer.length);
	destroyEverything()
	// loadSTLs(layer);

	switch(layer) {
		case "building":
			loadAllLevels('Level')
			tweenCamera(camera, [9819, 6873, 16535], 1000)

			break;
		case "levels":
			loadAllLevels('Level')	
			// tweenCamera(camera, [6801, 1769, 7331], 1000)

			break;
		default: 
			loadAllLevels('Room')
			// tweenCamera(camera, [7224, 1560, 6665], 1000)
	}
}



function updateObjectOpacities(level) {
	/*Given a uuid, fades all other objects of that type in the scene */
	destroyEverything()

	$.each(uuids, function (k, v) {
		test_level = v['level']

		if (test_level > cur_level - 1) {
			visible = false;
			new_opacity = 1;
		} else {
			visible = true;
			// new_opacity = 0.125;
			new_opacity = 0.08;
		}

		const object = scene.getObjectByProperty('uuid', k);
		object.visible = visible;
		tweenOpacity(object, new_opacity, 400);
	});
}


function get_rooms_from_level(level){
	console.log(`Getting rooms from level ${level}`)

	$.each(room_objs, function(k,v) {
		// if (v['building'] === building) {
		if (true) {	
			if (v['level'] === `${level}`) {
				loadGeomFromOutline(v)
			}
		}

	})

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
		infection_count: data.infection_count,
		kind: data.kind,
		outline: data.outline
	}

	return object
}



function pageOnLoad() {
	console.log("Executed Page on Load")
}


function load_all_from_psql() {
	console.log("here")

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
					room_objs.push(obj)

				}

			}
        }
    });

}

// Main Functions ===================================================================



function init() {

	init_three_js();
	load_all_from_psql();

}


// MAIN ===================================================================

init();
animate();



