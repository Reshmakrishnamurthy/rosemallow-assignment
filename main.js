import * as THREE from "three";
import TWEEN from "three/addons/libs/tween.module.js";
import { TrackballControls } from "three/addons/controls/TrackballControls.js";
import { CSS3DRenderer, CSS3DObject } from "three/addons/renderers/CSS3DRenderer.js";

/* =========================
   GOOGLE CONFIG
========================= */

const CLIENT_ID = "12449919735-pklvi8iitaq2a0n7j4dqj4rrmo4qnsjn.apps.googleusercontent.com";
const API_KEY = "AIzaSyB6CKQ0GEoiOvkF4G7LP0imkGtkbaqbsuI";
const SPREADSHEET_ID = "1EjV_TcfMYNFc-_milcW5bnQsw8CFa23V5XRqsOzZ38g";
const RANGE = "'Data Template'!A:F";

/* =========================
   THREE JS VARIABLES
========================= */

let camera;
let scene;
let renderer;
let controls;
let hasStarted = false;
let objects = [];

const targets = {
  table: [],
  sphere: [],
  helix: [],
  grid: []
};

/* =========================
   GOOGLE LOGIN
========================= */

window.addEventListener("load", () => {
  waitForGoogleLogin();
});

function waitForGoogleLogin() {
  if (!window.google || !google.accounts || !google.accounts.id) {
    setTimeout(waitForGoogleLogin, 200);
    return;
  }

  google.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: handleCredentialResponse
  });

  google.accounts.id.renderButton(
    document.getElementById("google-signin-button"),
    {
      theme: "outline",
      size: "large",
      text: "signin_with",
      shape: "rectangular"
    }
  );
}

function handleCredentialResponse(response) {
  if (!response || !response.credential) {
    showLoginError("Google Sign In failed. Please try again.");
    return;
  }

  document.getElementById("login-page").style.display = "none";
  document.getElementById("app").classList.remove("hidden");

  if (!hasStarted) {
    hasStarted = true;
    loadSheetData();
  }
}

function showLoginError(message) {
  const errorBox = document.getElementById("login-error");
  if (errorBox) errorBox.textContent = message;
}

/* =========================
   LOAD GOOGLE SHEET DATA
========================= */

async function loadSheetData() {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(RANGE)}?key=${API_KEY}`;

    const response = await fetch(url);
    const result = await response.json();

    if (!response.ok || !result.values) {
      console.error("Google Sheets API error:", result);
      alert("Could not load Google Sheet data. Check Sheet sharing, API key, and Google Sheets API settings.");
      return;
    }

    const rows = result.values;
    const data = rows.slice(1).map((row) => ({
      name: row[0] || "No Name",
      photo: row[1] || "",
      age: row[2] || "-",
      country: row[3] || "-",
      interest: row[4] || "-",
      netWorth: row[5] || "$0"
    }));

    init(data);
    animate();
  } catch (error) {
    console.error("Error loading Google Sheet:", error);
    alert("Error loading Google Sheet data. Open Console for details.");
  }
}

/* =========================
   HELPERS
========================= */

function parseNetWorth(value) {
  if (!value) return 0;
  return Number(String(value).replace("$", "").replace(/,/g, "").trim());
}

function getBackgroundColor(netWorthText) {
  const value = parseNetWorth(netWorthText);

  if (value > 200000) return "rgba(0, 180, 80, 0.88)";
  if (value > 100000) return "rgba(255, 140, 0, 0.88)";
  return "rgba(220, 40, 40, 0.88)";
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* =========================
   INIT 3D SCENE
========================= */

function init(data) {
  camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 10000);
  camera.position.z = 3200;

  scene = new THREE.Scene();
  objects = [];
  targets.table = [];
  targets.sphere = [];
  targets.helix = [];
  targets.grid = [];

  const container = document.getElementById("container");
  container.innerHTML = "";

  data.forEach((person) => {
    const element = document.createElement("div");
    element.className = "element";
    element.style.background = getBackgroundColor(person.netWorth);

    element.innerHTML = `
      <img src="${escapeHtml(person.photo)}" alt="Profile image" onerror="this.style.visibility='hidden'">
      <div class="name">${escapeHtml(person.name)}</div>
      <div class="details">Age: ${escapeHtml(person.age)}</div>
      <div class="details">Country: ${escapeHtml(person.country)}</div>
      <div class="details">${escapeHtml(person.interest)}</div>
      <div class="worth">${escapeHtml(person.netWorth)}</div>
    `;

    const objectCSS = new CSS3DObject(element);
    objectCSS.position.x = Math.random() * 4000 - 2000;
    objectCSS.position.y = Math.random() * 4000 - 2000;
    objectCSS.position.z = Math.random() * 4000 - 2000;

    scene.add(objectCSS);
    objects.push(objectCSS);
  });

  createTableTargets(data);
  createSphereTargets(data);
  createDoubleHelixTargets(data);
  createGridTargets(data);

  renderer = new CSS3DRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  controls = new TrackballControls(camera, renderer.domElement);
  controls.minDistance = 500;
  controls.maxDistance = 7000;
  controls.addEventListener("change", render);

  document.getElementById("table").addEventListener("click", () => transform(targets.table, 2000));
  document.getElementById("sphere").addEventListener("click", () => transform(targets.sphere, 2000));
  document.getElementById("helix").addEventListener("click", () => transform(targets.helix, 2000));
  document.getElementById("grid").addEventListener("click", () => transform(targets.grid, 2000));

  transform(targets.table, 2000);
  window.addEventListener("resize", onWindowResize);
}

/* =========================
   TABLE LAYOUT: 20 x 10
========================= */

function createTableTargets(data) {
  data.forEach((person, i) => {
    const object = new THREE.Object3D();
    const column = i % 20;
    const row = Math.floor(i / 20);

    object.position.x = column * 150 - 1425;
    object.position.y = -(row * 190) + 850;
    object.position.z = 0;

    targets.table.push(object);
  });
}

/* =========================
   SPHERE LAYOUT
========================= */

function createSphereTargets(data) {
  const vector = new THREE.Vector3();

  data.forEach((person, i) => {
    const object = new THREE.Object3D();
    const phi = Math.acos(-1 + (2 * i) / data.length);
    const theta = Math.sqrt(data.length * Math.PI) * phi;

    object.position.setFromSphericalCoords(1000, phi, theta);
    vector.copy(object.position).multiplyScalar(2);
    object.lookAt(vector);

    targets.sphere.push(object);
  });
}

/* =========================
   DOUBLE HELIX LAYOUT
========================= */

function createDoubleHelixTargets(data) {
  const vector = new THREE.Vector3();

  data.forEach((person, i) => {
    const object = new THREE.Object3D();
    const strand = i % 2;
    const index = Math.floor(i / 2);
    const theta = index * 0.35 + Math.PI * strand;
    const y = -(index * 18) + 900;

    object.position.x = 900 * Math.sin(theta);
    object.position.y = y;
    object.position.z = 900 * Math.cos(theta);

    vector.x = object.position.x * 2;
    vector.y = object.position.y;
    vector.z = object.position.z * 2;
    object.lookAt(vector);

    targets.helix.push(object);
  });
}

/* =========================
   GRID LAYOUT: 5 x 4 x 10
========================= */

function createGridTargets(data) {
  data.forEach((person, i) => {
    const object = new THREE.Object3D();
    const x = i % 5;
    const y = Math.floor(i / 5) % 4;
    const z = Math.floor(i / 20);

    object.position.x = x * 360 - 720;
    object.position.y = -y * 360 + 540;
    object.position.z = z * 520 - 2500;

    targets.grid.push(object);
  });
}

/* =========================
   ANIMATION
========================= */

function transform(targetList, duration) {
  TWEEN.removeAll();

  objects.forEach((object, i) => {
    const target = targetList[i];
    if (!target) return;

    new TWEEN.Tween(object.position)
      .to({ x: target.position.x, y: target.position.y, z: target.position.z }, Math.random() * duration + duration)
      .easing(TWEEN.Easing.Exponential.InOut)
      .start();

    new TWEEN.Tween(object.rotation)
      .to({ x: target.rotation.x, y: target.rotation.y, z: target.rotation.z }, Math.random() * duration + duration)
      .easing(TWEEN.Easing.Exponential.InOut)
      .start();
  });

  new TWEEN.Tween({}).to({}, duration * 2).onUpdate(render).start();
}

/* =========================
   RENDER
========================= */

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  render();
}

function animate() {
  requestAnimationFrame(animate);
  TWEEN.update();
  controls.update();
}

function render() {
  renderer.render(scene, camera);
}
