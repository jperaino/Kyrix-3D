console.log("Loaded main.js")

// REQUIREMENTS ===================================================================
const THREE = require('three')
const OrbitControls = require('three-orbitcontrols')
const STLLoader = require('three-stl-loader')(THREE)

// PROPERTIES ===================================================================

// Colors
var colors = {
	'background': new THREE.Color( 0xEEEEEE )
}







// MODE HANDLERS ===================================================================

var mode = 'buildings'

function set_mode(new_mode) {
	/* Given a string containing a new mode, performs update functions to toggle mode */
	console.log(`Changing mode to ${new_mode}`)

	switch(new_mode){
		case 'buildings':
			mode_to_all_buildings();
			break;
		case 'level':
			mode_to_level();
			break;
		default:
			console.log(`ERROR! No mode called ${new_mode}`)
	}
}


function mode_to_all_buildings() {
	mode = 'buildings'

}


function mode_to_level() {
	mode = 'level'

}


// THREE.JS ===================================================================

function init_three_js() {
	/* Initializes three.js */

	// Scene
	scene = new THREE.Scene();
	scene.background = colors.background;

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
	document.addEventListener( 'mousedown', viewPatients, false);

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

	// Load Ground Plane
	loadGroundPlane();

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

	children = scene.children;

	
	if (mode === 'infections') {
		
		temp_children = []
		$.each(children, function(k, v){
			if (v.type === "Mesh") {
				if (uuids[v.uuid].kind === 'Room') {
					temp_children.push(v)
				}
			}
		})
		children = temp_children

	}


	// var intersects = raycaster.intersectObjects(children);



	// if ( intersects.length > 0 ) {
	// 	if ( INTERSECTED != intersects[ 0 ].object ) {
	// 		if ( INTERSECTED ) {
	// 			INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
	// 		}
	// 		INTERSECTED = intersects[ 0 ].object;
	// 		INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
	// 		INTERSECTED.material.emissive.setHex( 0x0000FF );
	// 		$("#highlighted-info").empty();

	// 		cur_k_obj = uuids[INTERSECTED.uuid];

	// 		console.log(cur_k_obj)
	// 		room_name = cur_k_obj['room']
	// 		building_name = cur_k_obj['building']
	// 		floor_name = cur_k_obj['level']
	// 		infections = cur_k_obj['infections']


	// 		if (mode !== 'infections') {
	// 			$("#room_body").empty();
	// 			$("#room_body").append(
	// 				`<tr><th scope='row'>${room_name}</th><td>${building_name}</td><td>${floor_name}</td><td>${infections}</td></tr>`
	// 				)
	// 		} else {
	// 			console.log(INTERSECTED)
	// 			console.log(INTERSECTED.uuid)
	// 			$(`#${room_name}`).addClass('table-danger')
	// 		}
	// 	}


	// } else {
	// 	if ( INTERSECTED ) {
	// 		INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex )
	// 		if (mode !== 'infections') {
	// 			$("#highlighted-info").empty();
	// 			$("#room_body").empty();
	// 		} else {
	// 			cur_k_obj = uuids[INTERSECTED.uuid];
	// 			room_name = cur_k_obj['room'];
	// 			$(`#${room_name}`).removeClass('table-danger')
	// 		}
	// 	};
	// 	INTERSECTED = null;

	// }

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

		if (mode !== 'infections') {
			onGeometryClick(INTERSECTED.uuid)
		} else {
			// onDetailRoomClick(INTERSECTED.uuid)
			console.log("not infections")
			viewPatients();
		}
		
	}
}


function loadGroundPlane() {

	var geometry = new THREE.PlaneGeometry( 200000, 200000, 32 );
	geometry.rotateX( - Math.PI / 2);
	color = d3.interpolateOrRd(0)
	var material = new THREE.MeshPhongMaterial( { color: color, specular: color, shininess: 0, flatShading: false, transparent: false, opacity: 1} );
	var plane = new THREE.Mesh( geometry, material );
	scene.add( plane );

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

// MAIN ===================================================================

function pageOnLoad() {
	console.log("Executed Page on Load")
}

function init(){
	set_mode('buildings')
	init_three_js();
	load_all_from_psql();
}

init();
animate();





