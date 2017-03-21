const THREE = require('three');

import Agent from './agent.js';

function Marker(pos, owner) {
  this.pos = pos;
  this.owner = owner;
}

export default class BioCrowd {

  constructor(App) {
    this.init(App);
  }

  init(App) {
    this.isPaused = false;
    VISUAL_DEBUG = App.config.visualDebug;

    this.gridCellWidth = App.config.gridCellWidth;
    this.gridCellHeight = App.config.gridCellHeight;
    this.gridCellDepth = App.config.gridCellDepth;
    this.gridWidth = App.config.gridWidth;
    this.gridHeight = App.config.gridHeight;
    this.gridDepth = App.config.gridDepth;

    this.camera = App.camera;
    this.scene = App.scene;

    this.voxels = [];

    this.showMakers = true;
  };

  reset() {
  	this.scene.remove(this.mesh);
  };

  // Convert from 1D index to 3D indices
  i1toi2(i1) {
    return [i1 % this.res, ~~ ((i1 % this.res2) / this.res)];
  };

  // Convert from 3D indices to 1 1D
  i2toi1(ix, iy) {
    return ix + iy * this.res;
  };

  // Convert from 3D indices to 3D positions
  i3toPos(i3) {
    return new THREE.Vector3(
      i3[0] * this.gridCellWidth + this.origin.x + this.halfCellWidth,
      i3[1] * this.gridCellHeight + this.origin.y + this.halfCellHeight,
      i3[2] * this.gridCellDepth + this.origin.z + this.halfCellDepth
    );
  };

  setupGrid() {
    // Allocate voxels based on our grid resolution
    this.gridCells = [];
    for (var i = 0; i < this.res3; i++) {
      var i3 = this.i1toi3(i);
      var {x, y, z} = this.i3toPos(i3);
      var voxel = new Voxel(new THREE.Vector3(x, y, z), this.gridCellWidth, this.gridCellHeight, this.gridCellDepth);
      this.voxels.push(voxel);

      if (VISUAL_DEBUG) {
        this.scene.add(voxel.wireframe);
        this.scene.add(voxel.mesh);
      }
    }
  }

  setupMetaballs() {

    var x, y, z, vx, vy, vz, radius, pos, vel;
    var matLambertWhite = LAMBERT_WHITE;
    var maxRadiusTRippled = this.maxRadius * 3;
    var maxRadiusDoubled = this.maxRadius * 2;

    // Randomly generate metaballs with different sizes and velocities
    for (var i = 0; i < this.numMetaballs; i++) {
      x = this.gridWidth / 2;
      y = this.gridHeight / 2;
      z = this.gridDepth / 2;
      pos = new THREE.Vector3(3, 3, 3);

      vx = 0
      vy = (Math.random() * 2 - 1) * this.maxSpeedY/10;
      vz = 0
      vel = new THREE.Vector3(vx, vy, vz);

      radius = Math.random() * (this.maxRadius - this.minRadius) + this.minRadius;
      var neg = 1;
      if (Math.random()>0.75) neg = -1;
      var ball = new Metaball(pos, radius, vel, neg, this.gridWidth, this.gridHeight, this.gridDepth, VISUAL_DEBUG);
      balls.push(ball);

      // if (VISUAL_DEBUG) {
      //   this.scene.add(ball.mesh);
      // }
    }
    this.balls = balls;
  }

  update() {

    if (this.isPaused) {
      return;
    }

  }

  pause() {
    this.isPaused = true;
  }

  play() {
    this.isPaused = false;
  }

  show() {
    for (var i = 0; i < this.res3; i++) {
      this.voxels[i].show();
    }
    this.showGrid = true;
  };

  hide() {
    for (var i = 0; i < this.res3; i++) {
      this.voxels[i].hide();
    }
    this.showGrid = false;
  };

// ------------------------------------------- //

class GridCell {

  constructor() {
    this.init();
  }

  init(pos, isovalue, visualDebug) {
    this.pos = pos;
    this.markers = [];
  };
}
