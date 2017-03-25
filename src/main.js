const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about this much
//const OBJLoader = require('three-obj-loader');
//OBJLoader(THREE)

import Framework from './framework'
import BioCrowd from './bio_crowd.js'

const DEFAULT_VISUAL_DEBUG = false;
const DEFAULT_GRID_RES = 10;
const DEFAULT_GRID_WIDTH = 4;
const DEFAULT_GRID_HEIGHT = 4;
const DEFAULT_NUM_AGENTS = 4;
const DEFAULT_NUM_MARKERS = 400;
const DEFAULT_RADIUS = 1;
const DEFAULT_MAX_VELOCITY = 1;

var options = {lightColor: '#ffffff',lightIntensity: 1,ambient: '#111111', albedo: '#110000'};

var App = {
  //
  bioCrowd:             undefined,
  agentGeometry:        new THREE.CylinderGeometry(5,5,10),
  agentMaterial:        new THREE.MeshBasicMaterial({color: 0xffff00}),
  config: {
    visualDebug:      DEFAULT_VISUAL_DEBUG,
    isPaused:         false,
    gridRes:          DEFAULT_GRID_RES,

    cellWidth:  DEFAULT_GRID_WIDTH / DEFAULT_GRID_RES,
    cellHeight: DEFAULT_GRID_HEIGHT / DEFAULT_GRID_RES,

    maxMarkers:       DEFAULT_NUM_MARKERS,
    numAgents:        DEFAULT_NUM_AGENTS,
    agentRadius:      DEFAULT_RADIUS, 
    maxVelocity:      DEFAULT_MAX_VELOCITY,
    destination:      new THREE.Vector2(0,0)      
  },

  // Scene's framework objects
  camera:           undefined,
  scene:            undefined,
  renderer:         undefined,
};

// called after the scene loads
function onLoad(framework) {

  var {scene, camera, renderer, gui, stats} = framework;
  App.scene = scene;
  App.camera = camera;
  App.renderer = renderer;

  renderer.setClearColor( 0x111111 );

  //scene.add(new THREE.AxisHelper(4));
  setupCamera(App.camera);
  //setupLights(App.scene);
  setupScene(App.scene);
  setupGUI(gui);
}

// called on frame updates
function onUpdate(framework) {
  if (App.bioCrowd) {
    App.bioCrowd.update();
  }
}

function setupCamera(camera) {
  // set camera position
  camera.position.set(2, 2, 4);
  camera.lookAt(new THREE.Vector3(2, 2, 0));
}

function setupScene(scene) {
  App.bioCrowd = new BioCrowd(App);
}

function setupGUI(gui) {

  gui.add(App.config, 'isPaused').onChange(function(value) {
    App.isPaused = value;
    if (value) App.bioCrowd.pause();
    else App.bioCrowd.play();
  });
  gui.add(App.config, 'visualDebug').onChange(function(value) {
    if (value) App.bioCrowd.show();
    else App.bioCrowd.hide();
  });
  gui.add(App.config, 'numAgents', 1, 10).step(1).onChange(function(value) {
    App.bioCrowd.reset();
    App.bioCrowd = new BioCrowd(App);
  });
  gui.add(App.config, 'agentRadius', 0, 1).onChange(function(value) {
    App.bioCrowd.reset();
    App.bioCrowd = new BioCrowd(App);
  });
}

function setupLights(scene) {

  // Directional light
  var directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
  directionalLight.color.setHSL(0.1, 1, 0.95);
  directionalLight.position.set(1, 10, 2);
  directionalLight.position.multiplyScalar(10);

  scene.add(directionalLight);
}

// when the scene is done initializing, it will call onLoad, then on frame updates, call onUpdate
Framework.init(onLoad, onUpdate);
