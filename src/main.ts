import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'three/examples/jsm/libs/stats.module'
import { Wave } from './wave.js'

// Set up renderer and scene
const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.getElementById("three-container")?.appendChild( renderer.domElement );
const scene = new THREE.Scene();

// Set up camera and camera controls
const camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 3000 );
camera.position.set( 100, 200, 0 );

const init_particle_width = parseInt((document.getElementById('width') as HTMLInputElement).value);
const init_particle_spread = parseInt((document.getElementById('spread') as HTMLInputElement).value);
const controls = new OrbitControls(camera, renderer.domElement);
// initially look at center of wave
controls.target = new THREE.Vector3(
    init_particle_spread * init_particle_width / 2, 
    0, 
    init_particle_spread * init_particle_width / 2
);

// Create particle wave
const wave = new Wave(init_particle_width, init_particle_width, init_particle_spread, 0.1, 5.5);
scene.add(wave.points);

// Stats to track fps
const stats = new Stats()
document.getElementById("stats")?.appendChild(stats.dom);

function onPointerMove( event: PointerEvent ) {
	// calculate pointer position in normalized device coordinates
	// (-1 to +1) for both components
    const pointer = new THREE.Vector3();
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    pointer.z = 0; // dealing with a 2D plane, so ignore z

    // Convert screen space to world coordinates
    const worldPos = new THREE.Vector3(pointer.x, pointer.y, pointer.z);
    worldPos.unproject(camera);

    // Calculate the intersection point with the XZ plane (y = 0)
    const dir = worldPos.sub(camera.position).normalize();
    const distance = -camera.position.y / dir.y;
    const pos = dir.multiplyScalar(distance).add(camera.position);
    
    // Update the shader uniform for the mouse pointer position
    wave.points.material.uniforms.pointer.value.copy(pos);
}

let time = 0.0;
function update_state_and_render() {
    // Update all class attributes with the input box values.
    // Not ideal but works fine for this small project
    wave.setFreq(parseFloat((document.getElementById('freq') as HTMLInputElement).value));
    wave.setAmp(parseFloat((document.getElementById('amp') as HTMLInputElement).value));
    wave.setWidth(parseInt((document.getElementById('width') as HTMLInputElement).value));
    wave.setHeight(parseInt((document.getElementById('height') as HTMLInputElement).value));
    wave.setSpread(parseInt((document.getElementById('spread') as HTMLInputElement).value));
    wave.setRadius(parseInt((document.getElementById('radius') as HTMLInputElement).value));
    wave.setStrength(parseInt((document.getElementById('strength') as HTMLInputElement).value));

    wave.updateScene(scene);

    wave.points.material.uniforms.time.value = time;
    time += 0.05; // hopefully it doesnt overflow...

    controls.update()
    renderer.render(scene, camera)
    stats.update()
}

function onWindowResize(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

window.addEventListener( 'resize', onWindowResize, false );
window.addEventListener( 'pointermove', onPointerMove );
renderer.setAnimationLoop(update_state_and_render);