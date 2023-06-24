import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import gsap from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin.js';
import { isEqual } from 'lodash';
import Stats from 'three/examples/jsm/libs/stats.module'
import * as TWEEN from '@tweenjs/tween.js';
import {RGBELoader} from 'three/examples/jsm/loaders/RGBELoader'

const hdrTextureURL = new URL('../img/hdri.hdr', import.meta.url)

const buildingURL = new URL('../assets/building.glb', import.meta.url);
const renderer = new THREE.WebGLRenderer({ antialias: true });

// renderer.outputEncoding = THREE.LinearEncoding;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
// renderer.physicallyCorrectLights = true;

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const interpolatedPoints = [];
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  10000,
);


//CAMERA FREE MOVEMENT OPTIONS
// const orbit = new OrbitControls(camera, renderer.domElement);
const controls = new FirstPersonControls(camera, renderer.domElement);
controls.movementSpeed = 8;
controls.lookSpeed = 0.08;

//SHOWS AXES
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

//DEFAULT CAMERA POSITION
camera.position.set(235, 162, 370);
camera.lookAt(11, 8, 49);
// orbit.update();

// const loaderTexture = new RGBELoader();
// loaderTexture.load(hdrTextureURL, function(texture){
//   texture.mapping = THREE.EquirectangularReflectionMapping;
//   scene.background = texture;
// })

// const spotLight = new THREE.SpotLight(0xffffff);
// spotLight.position.set(-100, 400, 0);
// spotLight.castShadow = true;
// spotLight.angle = 1;
// scene.add(spotLight);

const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
scene.add(directionalLight);
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
scene.add(dLightHelper);

const dLightShadowHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
scene.add(dLightShadowHelper);


//VARIABLES
var model = null;
var start = { x: 0, y: 0 };
var counter = 0;
var currentIndex = 0;

var childMesh = null;
const clock = new THREE.Clock();
const assetLoader = new GLTFLoader();
assetLoader.load(buildingURL.href, function (gltf) {
  model = gltf.scene;
  console.log('MODEL', model);
  model.scale = gltf.scene.scale.set(
    0.1 * gltf.scene.scale.x,
    0.1 * gltf.scene.scale.y,
    0.1 * gltf.scene.scale.z,
  );
  model.position.set(0, 0, 0);

  model.traverse(function(node) {
    if (node.isMesh) {
      // Create and assign the MeshStandardMaterial
      const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
      // node.material = material;
      node.receiveShadow = true;
      node.castShadow = true;
    }
  });

  scene.add(model);
});

const pointSets = [
  {
    startPoint: new THREE.Vector3(235, 162, 370),
    endPoint: new THREE.Vector3(36.56, 12, 48.96),
  },
  {
    startPoint: new THREE.Vector3(36.56, 12, 48.96),
    endPoint: new THREE.Vector3(-11, 8, 49),
    step: 50
  },
  {
    startPoint: new THREE.Vector3(-11, 8, 49),
    endPoint: new THREE.Vector3(-18, 7.7, 49.86),
    step: 50
  },
  {
    startPoint: new THREE.Vector3(-18, 7.7, 49.86),
    endPoint: new THREE.Vector3(-30.8, 7.7, 55.2),
    step: 50
  },
  {
    startPoint: new THREE.Vector3(-30.8, 7.7, 55.2),
    endPoint: new THREE.Vector3(-30, 7.4, 59.8),
    
  },
  // Add more sets as needed
];

function raycast(){
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
      console.log('OBJECT:', intersects )
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

function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

//FOR DEBUGGING
window.addEventListener('click', function () {
  console.log(camera.position);
  console.log(camera.rotation);
});
raycast();
window.addEventListener('wheel', handleMouseWheel);
window.addEventListener('touchstart', touchStart, false);
window.addEventListener('touchmove', touchMove, false);

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
gsap.registerPlugin(MotionPathPlugin);

const curve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(235, 162, 370),
  new THREE.Vector3(36.56, 12.34, 48.96),
]);

function interpolation(){
  // const numPoints = 20;
    for (const pointSet of pointSets) {
      const { startPoint, endPoint, steps = 20, interpolationType = 'linear' } = pointSet;

      if(interpolationType === 'linear'){
        for (let i = 1; i <= steps; i++) {
          const t = i / (steps + 1);
          const point = new THREE.Vector3().lerpVectors(startPoint, endPoint, t);
          interpolatedPoints.push(point);
        }
      }
      else if(interpolationType === 'bezier'){

      }
    }
}

function plottingCubesToPath(){
  const cubeGeometry = new THREE.BoxGeometry(0.05, 0.05, 0.05);
  const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  interpolatedPoints.forEach((point) => {
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cube.position.copy(point);
    scene.add(cube);
  });
}

interpolation();
plottingCubesToPath();

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


function handleCameraAngles(index, direction) {
  //CASES FOR CAMERA ANGLES
  console.log('Index:', index)
  const point = interpolatedPoints[index];
  
  if(index >= 0 && index<= 25){
    camera.lookAt(-11, 8, 49);
  }else if(index >= 26 && index<= 60){
    camera.lookAt(-30, 8, 51);
    // camera.lookAt(interpolatedPoints[currentIndex + 1]);

    // camera.lookAt(-29, 8, 49);
  }else if(index >= 61 && index<= 90){
    camera.lookAt(interpolatedPoints[currentIndex + 10]);

      // camera.lookAt(interpolatedPoints[currentIndex + 1]);
  }else if(index >= 81 && index<= 90){
    camera.lookAt(interpolatedPoints[currentIndex + 1]);
  }

  // if(index>= 26)
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

const points = curve.getPoints(50);
const geometry = new THREE.BufferGeometry().setFromPoints(points);
const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
const curveObject = new THREE.Line(geometry, material);
scene.add(curveObject);


const stats = new Stats();
document.body.appendChild(stats.dom);


// Animate the scene
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  stats.update();
  // controls.update(clock.getDelta())
}
animate();

window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.render(scene, camera);
}
