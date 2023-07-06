import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import gsap from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin.js';
import { isEqual } from 'lodash';
import Stats from 'three/examples/jsm/libs/stats.module';
import { RectAreaLightHelper } from 'three/examples/jsm/helpers/RectAreaLightHelper';
import * as TWEEN from '@tweenjs/tween.js';
import * as dat from 'dat.gui';


//BASIC VARIABLES
var model = null;
var start = { x: 0, y: 0 };
var counter = 0;
var currentIndex = 0;
var childMesh = null;
const clock = new THREE.Clock();
const assetLoader = new GLTFLoader();
const buildingURL = new URL('../assets/building.glb', import.meta.url);
const renderer = new THREE.WebGLRenderer({ antialias: true });
const interpolatedPoints = [];
const scene = new THREE.Scene();
const stats = new Stats();
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  10000,
);
const pointSets = [
  {
    startPoint: new THREE.Vector3(235, 162, 370),
    endPoint: new THREE.Vector3(36.56, 12, 48.96),
    interpolationType: 'linear'
  },
  {
    startPoint: new THREE.Vector3(36.56, 12, 48.96),
    endPoint: new THREE.Vector3(-11, 8, 49),
    interpolationType: 'linear'
  },
  {
    startPoint: new THREE.Vector3(-11, 8, 49),
    endPoint: new THREE.Vector3(-18, 7.7, 49.86),
    interpolationType: 'linear'
  },
  {
    startPoint: new THREE.Vector3(-18, 7.7, 49.86),
    endPoint: new THREE.Vector3(-30, 7.7, 55.2),
    controlPoint1: new THREE.Vector3(-27, 7.7, 50.86),
    controlPoint2: new THREE.Vector3(-28.8, 7.7, 53.2),
    interpolationType: 'bezier'
  },
  {
    startPoint: new THREE.Vector3(-30, 7.7, 55.2),
    endPoint: new THREE.Vector3(-30, 7.4, 59.8),
    interpolationType: 'linear'
  },
  // Add more sets as needed
];

//Initializing canvas to the dom
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
gsap.registerPlugin(MotionPathPlugin);


//DEFAULTS
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
camera.position.set(235, 162, 370);
// camera.lookAt(11, 8, 49);


//DEBUGGING CAMERA FREE MOVEMENT VARIABLES
// const orbit = new OrbitControls(camera, renderer.domElement);
const controls = new FirstPersonControls(camera, renderer.domElement);
controls.movementSpeed = 8;
controls.lookSpeed = 0.08;
// orbit.update();

//LIGHTING VARIABLES
//OUTSIDE LIGHTING
const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.015);

const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
directionalLight.position.set(200, 250, -20);
directionalLight.castShadow = true;
directionalLight.shadow.bias = -0.003;

directionalLight.shadow.camera.bottom = -3000;
directionalLight.shadow.camera.top = 3000;
directionalLight.shadow.camera.left = -3000;
directionalLight.shadow.camera.right = 3000;

directionalLight.shadow.mapSize.width = 10240;
directionalLight.shadow.mapSize.height = 10240;

const dLightHelper = new THREE.DirectionalLightHelper(directionalLight, 5);

const dLightShadowHelper = new THREE.CameraHelper(directionalLight.shadow.camera);

//INTERNAL LIGHTS
const directLight1 = new THREE.RectAreaLight(0xFFFFFF, 20, 2, 6);
directLight1.position.set(-29, 12, 49.7);
directLight1.rotation.x = 0;
directLight1.lookAt(-29, 0, 49.7);

const directLight2 = new THREE.RectAreaLight(0xFFFFFF, 10, 6, 2);
directLight2.position.set(-26.5, 12, 67.5);
directLight2.rotation.x = 0;
directLight2.lookAt(-26.5, 0, 67.5);


//HELPERS
const axesHelper = new THREE.AxesHelper(5);

const helper1 = new RectAreaLightHelper( directLight1 );
const helper2 = new RectAreaLightHelper( directLight2 );


//PARTICLES
const particleGeometry = new THREE.BufferGeometry();
const positions = [];

// Add random positions to the particle positions array
const numParticles = 500;
for (let i = 0; i < numParticles; i++) {
  const x = Math.random() * 400 - 200;
  const y = Math.random() * 400 - 200;
  const z = Math.random() * 800 - 400;
  positions.push(x, y, z);
}
const positionsArray = new Float32Array(positions);

// Set the positions as an attribute in the buffer geometry
particleGeometry.setAttribute('position', new THREE.BufferAttribute(positionsArray, 3));
const particleMaterial = new THREE.PointsMaterial({
  size: 1,                    
  color: 0xffffff,            
  transparent: true,
  opacity: 0.5,
});

// Create a particle system with the buffer geometry and material
const particles = new THREE.Points(particleGeometry, particleMaterial);

//ADDING ITEMS TO 3D SCENE
//Add objects
scene.add(ambientLight, directionalLight, directLight1, directLight2, particles);

//Add helpers
// scene.add(axesHelper, dLightHelper, dLightShadowHelper);
// scene.add( helper1, helper2 );

//Load Model: Set scale and position
assetLoader.load(buildingURL.href, function (gltf) {
  model = gltf.scene;
  model.scale = gltf.scene.scale.set(
    0.1 * gltf.scene.scale.x,
    0.1 * gltf.scene.scale.y,
    0.1 * gltf.scene.scale.z,
  );
  model.position.set(0, 0, 0);
  model.traverse(function(node) {
    if (node.isMesh) {
      node.receiveShadow = true;
      node.castShadow = true;
    }
  });

  scene.add(model);
},
(xhr) => {
  console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
},
(error) => {
  console.log(error)
});

function raycast(){
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
      if (intersects[0].object.name === 'Red_Cone') {
        // Change color to a random color
        const redCone = intersects[0].object;
        redCone.material.color.set(getRandomColor());
        redCone.position.y += 1
      }
    }
  }
  
  window.addEventListener('click', onMouseMove);
}



//FOR DEBUGGING CAMERA POSITION AND ROTATION
// window.addEventListener('click', function () {
//   console.log(camera.position);
//   console.log(camera.rotation);
// });

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.render(scene, camera);
}

function touchStart(event) {
  start.x = event.touches[0].pageX;
  start.y = event.touches[0].pageY;
}

function touchMove(event) {
  counter++;
  if (counter % 5 === 0) {
    offset = {};

    offset.x = start.x - event.touches[0].pageX;
    offset.y = start.y - event.touches[0].pageY;

    let deltaEvent = {
      deltaX: offset.x,
      deltaY: offset.y,
    };

    handleMouseWheel(deltaEvent);
  }
}

function handleMouseWheel(event) {
  var deltaY = event.deltaY;

  if (deltaY > 0) {
    // Scroll down (forward)
    animateCameraForward();
  } else {
    // Scroll up (backward)
    animateCameraBackward();
  }
}

function interpolation(){
  // const numPoints = 20;
    for (const pointSet of pointSets) {
      const { startPoint, endPoint, steps = 20, interpolationType, controlPoint1, controlPoint2 } = pointSet;

      if(interpolationType === 'linear'){
        for (let i = 1; i <= steps; i++) {
          const t = i / (steps + 1);
          const point = new THREE.Vector3().lerpVectors(startPoint, endPoint, t);
          interpolatedPoints.push(point);
        }
      }
      else if(interpolationType === 'bezier'){
        // Combine interpolated points for all sets
          console.log('bezier')
          const numPoints = 20;
    
          const curve = new THREE.CubicBezierCurve3(
            startPoint,
            controlPoint1,
            controlPoint2,
            endPoint
          );

          // startPoint: new THREE.Vector3(-18, 7.7, 49.86),
          // endPoint: new THREE.Vector3(-30.8, 7.7, 55.2),
          
          const points = curve.getPoints( 50 );


          interpolatedPoints.push(...points);
      }
    }
    console.log('interpolatedFinal:', interpolatedPoints)
}

// Generate interpolated points for each set using Bezier interpolation
function generateBezierInterpolationPoints(startPoint, endPoint, numPoints) {
  // Define the control points for Bezier interpolation
  const controlPoint1 = new THREE.Vector3(
    startPoint.x + (endPoint.x - startPoint.x) / 3,
    startPoint.y + (endPoint.y - startPoint.y) / 3,
    startPoint.z + (endPoint.z - startPoint.z) / 3
  );
  const controlPoint2 = new THREE.Vector3(
    startPoint.x + (endPoint.x - startPoint.x) * 2 / 3,
    startPoint.y + (endPoint.y - startPoint.y) * 2 / 3,
    startPoint.z + (endPoint.z - startPoint.z) * 2 / 3
  );

  console.log('INTER VALUES:', startPoint, controlPoint1, controlPoint2, endPoint)

  // Create a cubic Bezier curve
  const curve = new THREE.CubicBezierCurve3(startPoint, controlPoint1, controlPoint2, endPoint);

  // Generate interpolated points along the curve
  const interpolatedPoints = curve.getPoints(numPoints);
  // console.log('interpolatedPoints:', interpolatedPoints)

  return interpolatedPoints;
}

function plottingCubesToPath(){
  const cubeGeometry = new THREE.BoxGeometry(0.01, 0.01, 0.01);
  const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  interpolatedPoints.forEach((point) => {
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cube.position.copy(point);
    scene.add(cube);
  });
}

function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}


function handleCameraAngles(index) {
  //CASES FOR CAMERA ANGLES

  if(index >= 0 && index<= 20){
    gsap.to(hiddenCube.position, {
      x: 11,
      y: 8,
      z: 49,
      duration: 2,
    });

  }else if(index >= 21 && index<= 28){
    gsap.to(hiddenCube.position, {
      x: -12,
      y: 8,
      z: 50,
      duration: 2,
    });
  }else if(index >= 29 && index<= 60){
    gsap.to(hiddenCube.position, {
      x: -30,
      y: 8,
      z: 51,
      duration: 1,
    });
  }else if(index >= 61 && index<= 100){
    gsap.to(hiddenCube.position, {
      x: interpolatedPoints[currentIndex + 10].x,
      y: interpolatedPoints[currentIndex + 10].y,
      z: interpolatedPoints[currentIndex + 10].z,
      duration: 1,
    });

  }else if(index >= 101 && index <=120){
    gsap.to(hiddenCube.position, {
      x: -30,
      y: 7.7,
      z: 60.2,
      duration: 2.5,
    })
  }
  else if(index >= 121 && index <=127){
    gsap.to(hiddenCube.position, {
      x: -29.5,
      y: 7.7,
      z: 70,
      duration: 1,
    })
  }
  else if(index >= 128){
    gsap.to(hiddenCube.position, {
      x: -25,
      y: 7.7,
      z: 70.2,
      duration: 2,
    })
  }
}

// Function to animate transition to the next point
function animateCameraForward() {
  const targetPoint = interpolatedPoints[currentIndex];
  const duration = 1; // Animation duration in seconds

  // Use GSAP to animate the camera to the target point
  gsap.to(camera.position, {
    x: targetPoint.x,
    y: targetPoint.y,
    z: targetPoint.z,
    duration,
    onUpdate: function () {
      // FOLLOW UPCOMING POINT
      // camera.lookAt(targetPoint);
      // camera.lookAt(interpolatedPoints[currentIndex + 1]);

      handleCameraAngles(currentIndex,'forward');
    },
  });

  if (currentIndex == interpolatedPoints.length - 1) {
    console.log('HIT');
  } else {
    currentIndex = (currentIndex + 1) % interpolatedPoints.length; // Increment the index
  }
}

// Function to animate transition to the previous point
function animateCameraBackward() {
  const targetPoint = interpolatedPoints[currentIndex];
  const duration = 1; // Animation duration in seconds
  // Use GSAP to animate the camera to the target point
  gsap.to(camera.position, {
    x: targetPoint.x,
    y: targetPoint.y,
    z: targetPoint.z,
    duration,
    onUpdate: function () {
      //FOLLOW PREVIOUS POINT
      // camera.lookAt(interpolatedPoints[currentIndex + 1]);
      handleCameraAngles(currentIndex,'backward');
    },
  });

  if (currentIndex !== 0) {
    //no nothing
    currentIndex = (currentIndex - 1) % interpolatedPoints.length; // Increment the index
  }
}

// Animate the scene
function animateScene() {
  camera.lookAt( hiddenCube.position );

  requestAnimationFrame(animateScene);
  renderer.render(scene, camera);
  stats.update();

  //CAMERA CONTROLS FOR DEBUGGING PURPOSES
  // controls.update(clock.getDelta())
}

//ADDING STATS PERFORMANCE ANALYTICS
document.body.appendChild(stats.dom);

//GUI
  // const cubeGeometry2 = new THREE.BoxGeometry(0.05, 0.1, 0.05);
  // const cubeMaterial2 = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  // const cube = new THREE.Mesh(cubeGeometry2, cubeMaterial2);
  // cube.position.copy(new THREE.Vector3(-25, 7.7, 70.2));
  // scene.add(cube)

const gui = new dat.GUI();

const options = {
  cubePosition: new THREE.Vector3(-29, 7.7, 70.2),
}

// gui.add(cube.position, 'x', -50 , 0)
// gui.add(cube.position, 'z', -100 , 100)
//EVENT LISTENERS
raycast();
window.addEventListener('wheel', handleMouseWheel);
window.addEventListener('touchstart', touchStart, false);
window.addEventListener('touchmove', touchMove, false);
window.addEventListener('resize', onWindowResize, false);

//HIDDEN CUBE LOGIC
const hiddenCubeGeometry = new THREE.BoxGeometry(0.10, 1, 0.10);
const hiddenCubeMaterial = new THREE.MeshBasicMaterial({ visible: false });
const hiddenCube = new THREE.Mesh(hiddenCubeGeometry, hiddenCubeMaterial);
scene.add(hiddenCube);
hiddenCube.position.set(11, 8, 49);

interpolation();
plottingCubesToPath();
animateScene();


