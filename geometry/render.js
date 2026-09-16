// Client-side viewer + UI wiring for the planet generator demo page.
// Everything Three.js-specific (and DOM-specific) lives here, not in
// geom.lib.js, so the library stays usable without pulling in a renderer.
//
// Three.js is loaded from a CDN (see the importmap in index.html <head>), not
// vendored into the repo — this page needs network access to unpkg.com to run.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { generatePlanet, exportPlanet, importPlanet } from './geom.lib.js';

// face[] is a flat, convex n-gon, vertices listed around its perimeter (not
// triangulated). Fan triangulation is correct precisely because faces are
// convex and (approximately) planar.
function facesToFillGeometry(vertex, face) {
  const positions = vertex.flat();
  const indices = [];
  for (const f of face) {
    for (let i = 1; i < f.length - 1; i++) {
      indices.push(f[0], f[i], f[i + 1]);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function facesToEdgeGeometry(vertex, face) {
  const seen = new Set();
  const positions = [];
  for (const f of face) {
    for (let i = 0; i < f.length; i++) {
      const a = f[i];
      const b = f[(i + 1) % f.length];
      const key = a < b ? `${a}_${b}` : `${b}_${a}`;
      if (seen.has(key)) continue;
      seen.add(key);
      positions.push(...vertex[a], ...vertex[b]);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  return geometry;
}

// Sets up a Three.js viewer in the given container and returns a controller
// with a single showBody method — scene/camera/light/resize/render-loop are
// all encapsulated here.
function createViewer(container) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111318);

  const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
  camera.position.set(2.5, 2, 3.5);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
  dirLight.position.set(5, 8, 6);
  scene.add(dirLight);

  let fillMesh = null;
  let edgeLines = null;

  function clearBody() {
    if (fillMesh) {
      scene.remove(fillMesh);
      fillMesh.geometry.dispose();
      fillMesh.material.dispose();
      fillMesh = null;
    }
    if (edgeLines) {
      scene.remove(edgeLines);
      edgeLines.geometry.dispose();
      edgeLines.material.dispose();
      edgeLines = null;
    }
  }

  function showBody(body) {
    clearBody();
    if (!body) return;

    const fillGeometry = facesToFillGeometry(body.vertex, body.face);
    const fillMaterial = new THREE.MeshStandardMaterial({
      color: 0x4f8ef7,
      flatShading: true,
      side: THREE.DoubleSide,
    });
    fillMesh = new THREE.Mesh(fillGeometry, fillMaterial);
    scene.add(fillMesh);

    const edgeGeometry = facesToEdgeGeometry(body.vertex, body.face);
    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x0a0d12 });
    edgeLines = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    scene.add(edgeLines);
  }

  function onResize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }
  window.addEventListener('resize', onResize);

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  return { showBody };
}

// --- UI wiring ---

const frequencyInput = document.getElementById('frequency');
const frequencyReadout = document.getElementById('frequency-readout');
const downloadBtn = document.getElementById('download-btn');
const loadBtn = document.getElementById('load-btn');
const loadInput = document.getElementById('load-input');
const viewer = createViewer(document.getElementById('viewer'));

let currentPlanet = null;

function showPlanet(planet) {
  currentPlanet = planet;
  const hexagons = planet.face.length - 12;
  frequencyReadout.textContent = `n = ${planet.face.length} faces (12 pentagons + ${hexagons} hexagons)`;
  viewer.showBody(planet);
}

function renderCurrentPlanet() {
  showPlanet(generatePlanet(Number(frequencyInput.value)));
}

downloadBtn.addEventListener('click', () => {
  const data = exportPlanet(currentPlanet);
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `planet-f${currentPlanet.frequency}-n${currentPlanet.face.length}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

loadBtn.addEventListener('click', () => loadInput.click());

loadInput.addEventListener('change', async () => {
  const file = loadInput.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const planet = importPlanet(data);
    frequencyInput.value = planet.frequency;
    showPlanet(planet);
  } catch (error) {
    alert(`Failed to load planet: ${error.message}`);
  } finally {
    loadInput.value = '';
  }
});

frequencyInput.addEventListener('input', renderCurrentPlanet);
renderCurrentPlanet();
