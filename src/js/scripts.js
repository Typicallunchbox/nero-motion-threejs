import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import gsap from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin.js';

const buildingURL = new URL('../assets/building.glb', import.meta.url);
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.shadowMap.enabled = true;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
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
camera.lookAt(-0.41, 0.52, 0.22);
// orbit.update();

const spotLight = new THREE.SpotLight(0xffffff);
spotLight.position.set(-100, 1000, 0);
spotLight.castShadow = true;
spotLight.angle = 0.2;
scene.add(spotLight);

// const sLightHelper = new THREE.SpotLightHelper(spotLight);
// scene.add(sLightHelper);
var model = null;
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

  //RED CONE
  

  // model.children[4].position.set(0,2500,0)
  scene.add(model);

  const redCone = model.children[2].position;
  console.log('redCone:', redCone);
});
console.log('scene:', scene)
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length > 0) {
    if (intersects[0].object === childMesh) {
      // Change color to a random color
      childMesh.material.color.set(getRandomColor());
    }
  }
}

window.addEventListener('mousemove', onMouseMove);

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

window.addEventListener('wheel', handleMouseWheel);
window.addEventListener('touchstart', touchStart, false);
window.addEventListener('touchmove', touchMove, false);

const handlePointerOver = (event) => {
  setHover(true);
  const edges = new EdgesGeometry(meshRef.current.geometry);
  const material = new THREE.LineBasicMaterial({ color: new Color('white') });
  const lineSegments = new LineSegments(edges, material);
  meshRef.current.add(lineSegments);
};

const handlePointerOut = (event) => {
  setHover(false);
  meshRef.current.remove(
    meshRef.current.children[meshRef.current.children.length - 1],
  );
};

var start = { x: 0, y: 0 };
var counter = 0;
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

// const pathPoints = [
//   [0,0,0]
// ]

// const pathPoints = [
//   {
//     name:'birdsEyeToGround',
//     points: [
//       {
//         start: {
//           x: 235,
//           y: 162,
//           z: 370
//         },
//         end: {
//           x: 36.5,
//           y: 12,
//           z: 48.9
//         }
//       }
//   ]
//   },
//   {
//     name:'groundToDoor',
//     points: [
//       {
//         start: {
//           x: 36.5,
//           y: 12,
//           z: 48.9
//         },
//         end: {
//           x: -11,
//           y: 12,
//           z: 49
//         }
//       }
//   ]
//   }
// ];

const pointSets = [
  {
    startPoint: new THREE.Vector3(235, 162, 370),
    endPoint: new THREE.Vector3(36.56, 12, 48.96),
  },
  {
    startPoint: new THREE.Vector3(36.56, 12, 48.96),
    endPoint: new THREE.Vector3(-11, 10, 49),
  },
  {
    startPoint: new THREE.Vector3(-11, 10, 49),
    endPoint: new THREE.Vector3(-18, 8, 49.86),
  },
  {
    startPoint: new THREE.Vector3(-18, 8, 49.86),
    endPoint: new THREE.Vector3(-30.8, 7.7, 55.2),
  },
  {
    startPoint: new THREE.Vector3(-30.8, 7.7, 55.2),
    endPoint: new THREE.Vector3(-30, 7.4, 59.8),
  },
  // Add more sets as needed
];

// Generate interpolated points for each set and combine them into a single array
const interpolatedPoints = [];
const numPoints = 20;
for (const pointSet of pointSets) {
  const { startPoint, endPoint } = pointSet;
  for (let i = 1; i <= numPoints; i++) {
    const t = i / (numPoints + 1);
    const point = new THREE.Vector3().lerpVectors(startPoint, endPoint, t);
    interpolatedPoints.push(point);
  }
}

// Add a cube to visualize the points
const cubeGeometry = new THREE.BoxGeometry(0.05, 0.05, 0.05);
const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
interpolatedPoints.forEach((point) => {
  const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
  cube.position.copy(point);
  scene.add(cube);
});

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

function handleCameraAngles(index) {
  //CASES FOR CAMERA ANGLES
  // if(index >= 15){
  //   camera.lookAt(-100, 0, 0);
  // }else{
  //   camera.lookAt(-0.41, 0.52, 0.22)
  // }
  if (currentIndex == interpolatedPoints.length - 1) {
    // camera.rotation(-3, -0.34, -3.10)
  }
  // camera.lookAt(-100, 0, 0);
  const targetPoint = interpolatedPoints[currentIndex];
}

// Index to keep track of the current point
let currentIndex = 0;

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

      handleCameraAngles(currentIndex);
    },
  });

  if (currentIndex == interpolatedPoints.length - 1) {
    console.log('HIT');
  } else {
    currentIndex = (currentIndex + 1) % interpolatedPoints.length; // Increment the index
  }
}

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
      handleCameraAngles(currentIndex);
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


//TO GET THE PROGRESS, take both endpoints and use them as a reference
//On mouse event add the range divided by 10 to x, y and z coords
// With these new coords we can move the camera positioning until we get to endpoint

let step = 0;
// Animate the scene
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  controls.update(clock.getDelta());
}
animate();

window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.render(scene, camera);
}
