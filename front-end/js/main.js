// main.js 

const THREE = require('three')
const OrbitControls = require('three-orbitcontrols')
const STLLoader = require('three-stl-loader')(THREE)

// Properties ===================================================================
console.log("Loaded main.js today")

var csv_file_path = '../data/Kyrix_Trial_200211.csv'

var current_zoom = "building"

var objects = []

var building_fps = [];
var building_k_objs = [];
var level_fps = [];
var level_k_objs = [];
var room_fps = [];
var room_k_objs = [];

var camera, controls, scene, renderer, raycaster;
var mouse = new THREE.Vector2(), INTERSECTED;
var radius = 100, theta = 0;


// Listener Methods ===================================================================

$(".layer-toggle").on("change", function(){
	switchToLayer(this.dataset.layer)
})


// D3 Methods ===================================================================

function load_csv(csv_file_path) {

	// Read CSV and sort rows into appropriate arrays
	d3.csv(csv_file_path, function(data) {

		var k_obj = {
			level: data.level,
			building: data.building,
			room: data.room,
			stl_fp: data.stl_fp,
			infection_count: data.infection_count
		}


		if (data.level === '') {
			building_fps.push(data.stl_fp)
			building_k_objs.push(k_obj)
		} else if (data.room === '') {
			level_fps.push(data.stl_fp)
			level_k_objs.push(k_obj)
		} else {
			room_fps.push(data.stl_fp)
			room_k_objs.push(k_obj)
		}
	})
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
	camera.position.set( 6000, 3127, 9162 );

	// Orbit Controls
	controls = new OrbitControls( camera, renderer.domElement );
	controls.enableDamping = true; 
	controls.dampingFactor = 0.05;
	controls.screenSpacePanning = false;
	controls.minDistance = 100;
	controls.maxDistance = 5000;
	controls.maxPolarAngle = Math.PI / 2;
	controls.easing = true;
	controls.target.set(8575,0,5366)

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
	console.log("Here... 2")
	console.log(globalVar.serverAddr)
	/* Handles mouse click events for three.js raycasting */
	event.preventDefault();
	raycaster.setFromCamera(mouse, camera);
	var intersects = raycaster.intersectObjects(scene.children);

	if (intersects.length > 0) {
		INTERSECTED = intersects[0].object
		onGeometryClick(INTERSECTED.uuid)

		// switch (current_zoom) {
		// 	case "building":
		// 		switchToLayer("levels");
		// 		break; 
		// 	case "levels":
		// 		switchToLayer("rooms");
		// 		break;
		// 	default:
		// 		switchToLayer("building");
		// }
	}
}


function onGeometryClick(uuid) {
	/* Performs actions to be performed when a geometry is clicked */
	console.log(uuid)
	$("#lower-console").text(uuid)
}


function onWindowResize() {
	/* Update rendera and camera on window resize */
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}


// THREE.JS Methods ===================================================================

function loadSTLs(layer) {
	/* Selects list of STLs to load and calls loading function */
	var files;

	// Select the appropriate stl files
	switch(layer) {
		case 'building':
			files = building_fps;
			k_objs = building_k_objs;
			break;
		case 'levels':
			files = level_fps;
			k_objs = level_k_objs;
			break;
		case 'rooms':
			files = room_fps;
			k_objs = room_k_objs;
			break;
	}

	// Iterate over selected stl files
	k_objs.forEach(function(k_obj){
		loadStl_k_obj(k_obj)
	})


	// // Iterate over selected stl files
	// files.forEach(function(fp){
	// 	loadStl('/data/stls-complex/' + fp) // DEBUG HERE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	// })
}


function pickHex(color1, color2, weight) {
    var w1 = weight;
    var w2 = 1 - w1;
    var rgb = [Math.round(color1[0] * w1 + color2[0] * w2),
        Math.round(color1[1] * w1 + color2[1] * w2),
        Math.round(color1[2] * w1 + color2[2] * w2)];
    return rgb;
}



function loadStl_k_obj(k_obj) {

	fp = '/data/stls-complex/' + k_obj.stl_fp

	var loader = new STLLoader();
	// loader.load('/data/stl/ALL.stl', function (geometry) {
	loader.load(fp, function (geometry) {
		
		color = 0xffffff;

		if (k_obj.infection_count != 0) {
			color = 0xFF0000;
		}

		var material = new THREE.MeshPhongMaterial( { color: color, specular: 0x111111, shininess: 0, flatShading: false} );
		// var material = new THREE.MeshPhongMaterial( { flatShading: true } );
		var mesh = new THREE.Mesh( geometry, material );

		console.log(k_obj.level)
		// mesh.position.set( 0, - 0.25, 0.6 );
		mesh.position.set( 0, k_obj.level * 100 * .5 , 0 );
		mesh.rotation.set( - Math.PI / 2, 0, - Math.PI / 2 );
		mesh.scale.set( 0.5, 0.5, 0.5 );
		// mesh.scale.set( 1,1,1 );

		mesh.castShadow = true;
		mesh.receiveShadow = true;

		scene.add( mesh );
		objects.push(mesh.uuid)

	} );
}




function loadStl(fp) {

	console.log("not working")
	var loader = new STLLoader();
	// loader.load('/data/stl/ALL.stl', function (geometry) {
	loader.load(fp, function (geometry) {
		
		// var material = new THREE.MeshPhongMaterial( { color: 0xffffff, specular: 0x111111, shininess: 0, flatShading: false} );
		var material = new THREE.MeshPhongMaterial( { flatShading: true } );
		var mesh = new THREE.Mesh( geometry, material );

		mesh.position.set( 0, - 0.25, 0.6 );
		mesh.rotation.set( - Math.PI / 2, 0, - Math.PI / 2 );
		mesh.scale.set( 0.5, 0.5, 0.5 );

		mesh.castShadow = true;
		mesh.receiveShadow = true;

		scene.add( mesh );
		objects.push(mesh.uuid)

	} );
}



function destroyEverything(){
	/* Destroy and dispose all objects in objects */
	while (objects.length > 0) {
		let uuid = objects.pop();
		// console.log(uuid)
		const object = scene.getObjectByProperty('uuid', uuid);
		object.geometry.dispose();
		object.material.dispose();
		scene.remove(object);
	}
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


function switchToLayer(layer) {
	current_zoom = layer;
	// console.log(layer.length);
	destroyEverything()
	loadSTLs(layer);

	switch(layer) {
		case "building":
			tweenCamera(camera, [6000, 3127, 9162], 1000)

			break;
		case "levels":
			tweenCamera(camera, [6801, 1769, 7331], 1000)

			break;
		default: 
			tweenCamera(camera, [7224, 1560, 6665], 1000)
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


function testPSQL(){

	$.ajax({
		type: "GET",
		
	})

}



// Main Functions ===================================================================

function init() {

	console.log("init")
	load_csv(csv_file_path);
	init_three_js();
	loadSTLs('building')


}


// MAIN ===================================================================

init();
animate();



