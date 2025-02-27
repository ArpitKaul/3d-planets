// Import necessary modules
import * as THREE from './node_modules/three/build/three.module.js';
import { RGBELoader } from './node_modules/three/examples/jsm/loaders/RGBELoader.js';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';
import gsap from './node_modules/gsap/index.js';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(25, window.innerWidth / window.innerHeight, 0.1, 100);
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#canvas'),
  antialias: true
});

// Configure renderer
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Add OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Adds smooth motion to camera control

// Load HDRI environment
const loader = new RGBELoader();
loader.load("https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/moonless_golf_1k.hdr", function (texture) {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = texture;
});

const radius = 1.3;
const segments = 64;
const orbitradius = 4.5;
const textures = ["./csilla/color.png", './earth/map.jpg', "./venus/map.jpg", "./volcanic/color.png"];
const spheres = new THREE.Group();

const starRadius = 50; 
const starGeometry = new THREE.SphereGeometry(starRadius, 64, 64);
const starTexture = new THREE.TextureLoader().load('./stars.jpg');
starTexture.colorSpace = THREE.SRGBColorSpace;
const starMaterial = new THREE.MeshStandardMaterial({
  map: starTexture,
  opacity: 0.3,
  side: THREE.BackSide 
});
const starSphere = new THREE.Mesh(starGeometry, starMaterial);
scene.add(starSphere);

const spheresMesh = [];

// Add lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
scene.add(hemiLight);

// Create planets
for (let i = 0; i < 4; i++) {
  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load(textures[i]);
  texture.colorSpace = THREE.SRGBColorSpace;

  const geometry = new THREE.SphereGeometry(radius, segments, segments);
  const material = new THREE.MeshStandardMaterial({ map: texture });
  const sphere = new THREE.Mesh(geometry, material);

  spheresMesh.push(sphere);

  const angle = (i / 4) * (Math.PI * 2);

  sphere.position.x = orbitradius * Math.cos(angle);
  sphere.position.z = orbitradius * Math.sin(angle);
  spheres.add(sphere);
}
spheres.rotation.x = 0.1;
spheres.position.y = -0.8;
scene.add(spheres);
camera.position.z = 9;

// Planet names and descriptions
const planetNames = ["Earth", "Mercury", "Jupiter", "Mars"];
const planetDescriptions = [
  "The planet where life exists.",
  "The smallest and fastest planet.",
  "T.he largest planet with a massive storm",
  "The smallest and fastest planet."
];

const headingElement = document.querySelector(".heading");
const descriptionElement = document.querySelector(".planet-description");
let scrollCount = 0;
let lastScrollTime = 0;
const scrollThrottleTime = 2000; // 2 seconds

function updateHeading(index, direction) {
  // Animate old text out of view
  gsap.to([headingElement, descriptionElement], {
    duration: 0.5,
    y: direction === 1 ? -50 : 50,
    opacity: 0,
    onComplete: () => {
      headingElement.textContent = planetNames[index];
      descriptionElement.textContent = planetDescriptions[index];

      gsap.fromTo(
        [headingElement, descriptionElement],
        { y: direction === 1 ? 50 : -50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5 }
      );
    }
  });
}

function throttledWheelHandler(event) {
  const currentTime = Date.now();
  if (currentTime - lastScrollTime >= scrollThrottleTime) {
    lastScrollTime = currentTime;

    const direction = event.deltaY > 0 ? 1 : -1;
    scrollCount = (scrollCount + direction + planetNames.length) % planetNames.length;

    updateHeading(scrollCount, direction);

    gsap.to(spheres.rotation, {
      duration: 1,
      y: `-=${direction * (Math.PI / 2)}`,
      ease: "power2.inOut"
    });
  }
}

// Set initial heading and description
updateHeading(scrollCount, 1);
window.addEventListener("wheel", throttledWheelHandler);

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Animation loop
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);

  // Add damping effect for OrbitControls
  controls.update();

  // Rotate planets
  for (let i = 0; i < spheresMesh.length; i++) {
    const sphere = spheresMesh[i];
    sphere.rotation.y = clock.getElapsedTime() * 0.02;
  }

  renderer.render(scene, camera);
}

animate();
