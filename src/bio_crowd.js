const THREE = require('three');

import Agent from './agent.js'

function Marker(pos) {
  this.pos = pos;
  this.weight = 0;
  this.owner = null;
}

function Obstacle(pos, radius) {
  this.pos = pos;
  this.radius = radius;
}

function distance(x, y) {
  var x1 = x.x - y.x; var y1 = x.y - y.y;
  return Math.sqrt(x1*x1 + y1*y1);
}

export default class BioCrowd {

  constructor(App) {
    this.init(App);
  }

  init(App) {
    this.isPaused = App.config.isPaused;
    this.origin = new THREE.Vector3(0,0,0);

    // dimensions
    this.grid = [];
    this.gridRes = App.config.gridRes;
    this.gridRes2 = this.gridRes * this.gridRes; // num of grid cells
    this.cellRes = App.config.cellRes; // num of mark in cell
    this.gridWidth = App.config.gridWidth;
    this.gridHeight = App.config.gridHeight;
    this.cellHeight = this.gridHeight/this.gridRes;
    this.cellWidth = this.gridHeight/this.gridRes;
    this.maxMarkers = this.gridRes2 * Math.sqrt(this.cellRes)*Math.sqrt(this.cellRes);

    // agents
    this.agents = [];
    this.numAgents = App.config.numAgents;
    this.agentRadius = App.config.agentRadius;
    this.agentGeo = App.agentGeometry;
    this.agentMat = App.agentMaterial;
    this.scenario = App.scenario;
   
    // scene data
    this.camera = App.camera;
    this.scene = App.scene;
    this.num_obs = App.obstacles;
    this.obstacles = [];

    this.debug = App.config.visualDebug;
    // markers 
    this.markerGeo = new THREE.BufferGeometry();
    this.m_positions = new Float32Array(this.maxMarkers * 3);
    this.markerMat = new THREE.PointsMaterial( { size: 0.1, color: 0x7eed6f } )
    this.markerPoints = new THREE.Points( this.markerGeo, this.markerMat );
    this.lineMat = new THREE.LineBasicMaterial( { color: 0x770000 } )

    this.initGrid();
    this.initAgents();
    if (this.debug) this.show();
  };

  // new grid and agents
  reset() {
    for (var i = 0; i < this.agents.length; i++) {
      this.scene.remove(this.agents[i].mesh);
      this.scene.remove(this.agents[i].lines); 
      this.scene.remove(this.agents[i].circle);
    }
   this.scene.remove(this.markerPoints);
  };

  // Convert from 1D index to 2D indices
  i1toi2(i1) { return [i1 % this.gridRes, ~~ ((i1 % this.gridRes2) / this.gridRes)];};

  // Convert from 2D indices to 1D
  i2toi1(ix, iy) { return ix + iy * this.gridRes; };

  // Convert from 2D indices to 2D positions
  i2toPos(i2) {
    return new THREE.Vector3(
      i2[0] * this.cellWidth + this.origin.x,
      i2[1] * this.cellHeight + this.origin.y, 0
    );
  };

  // Convert from position to 2D indices
  pos2i(vec2) {
    var x = Math.floor((vec2.x - this.origin.x) / this.cellWidth);
    var y = Math.floor((vec2.y - this.origin.y) / this.cellHeight);
    return this.i2toi1(x, y);
  };

  initGrid() {
    var x = 0;
    for (var k = 0; k < this.num_obs; k++) {
      var x1 = Math.random() * this.gridRes * this.cellWidth;
      var y1 = Math.random() * this.gridRes * this.cellHeight;
      this.obstacles.push(new Obstacle(new THREE.Vector3(x1, y1, 0), Math.random()+0.1));
      var geometry = new THREE.CircleGeometry( this.obstacles[k].radius, 16 );
      var material = new THREE.MeshBasicMaterial( { color: 0x4411bb } );
      var mesh = new THREE.Mesh( geometry, material );
      mesh.position.set(x1,y1,0);
      this.scene.add(mesh);
    }
    for (var i = 0; i < this.gridRes2; i++) {
      var i2 = this.i1toi2(i);
      var pos = this.i2toPos(i2);
      var cell = new GridCell(pos, this.cellRes, this.cellWidth, this.cellHeight, this.obstacles);
      this.grid.push(cell);
      for (var j = 0; j < cell.markers.length; j++) {
        this.m_positions[x++] = cell.markers[j].pos.x;
        this.m_positions[x++] = cell.markers[j].pos.y;
        this.m_positions[x++] = 0;
      }
      this.scene.add(this.grid[i].square);
    }
    this.markerGeo.addAttribute('position', new THREE.BufferAttribute(this.m_positions, 3));
    this.markerGeo.computeBoundingSphere();
  }

  initAgents() {
    for (var i = 0; i < this.numAgents; i ++) {
      switch (this.scenario) {
        case 'opposite':
            var pos = new THREE.Vector3(Math.random() * this.gridRes * this.cellWidth,
                                  Math.random() * this.gridRes * this.cellHeight,0);
            var hit = true;
            while (hit) {
              hit = false;
              for (var j = 0; j < this.num_obs; j++) {
                var dist = distance(pos, this.obstacles[j].pos);
                if (dist < this.obstacles[j].radius) {
                  hit = true;
                  pos = new THREE.Vector3(Math.random() * this.gridRes * this.cellWidth,
                                    Math.random() * this.gridRes * this.cellHeight,0);
                }
              }
            }
            var dest = new THREE.Vector3(0,0,0);
            break;
        default:
            var pos = new THREE.Vector3(Math.random() * this.gridRes * this.cellWidth,
                                  Math.random() * this.gridRes * this.cellHeight,0);
            var hit = true;
            while (hit) {
              hit = false;
                for (var j = 0; j < this.num_obs; j++) {
                var dist = distance(pos, this.obstacles[j].pos);
                if (dist < this.obstacles[j].radius) {
                  hit = true;
                  pos = new THREE.Vector3(Math.random() * this.gridRes * this.cellWidth,
                                    Math.random() * this.gridRes * this.cellHeight,0);
                }
              }
            }
            var dest = new THREE.Vector3(0,0,0);
      }
      pos.add(this.origin);
      dest.add(this.origin);
      var index = this.pos2i(pos);
      var ori = Math.atan2(dest.y - pos.y, dest.x - pos.x);
      var agent = new Agent(pos, index, ori, dest, this.agentRadius, this.agentGeo, this.agentMat, this.lineMat, this.maxMarkers);
      this.select(agent);
      this.agents.push(agent);
      this.scene.add(agent.mesh);
      this.scene.add(agent.circle);
    }
  }

  // disassociate markers and agents
  clear() {
    for (var i = 0; i < this.agents.length; i ++) {
      for (var j = 0; j < this.agents[i].markers.length; j ++) {
        this.agents[i].markers[j].owner = null;
        this.agents[i].markers[j].weight = 0;
      }
      this.agents[i].markers = [];
    } 
  }

  select() {
    var claimed = [];
    // every agent
    for (var k = 0; k < this.agents.length; k++) {
      var agent = this.agents[k];
      // check neighboring grid cells
      var i2 = this.i1toi2(agent.index);
      var min0 = Math.min(Math.max(0, i2[0] -1), this.gridRes); var max0 = Math.min(Math.max(0, i2[0] + 2), this.gridRes);
      var min1 = Math.min(Math.max(0, i2[1] -1), this.gridRes); var max1 = Math.min(Math.max(0, i2[1] + 2), this.gridRes);
      for (var i = min0; i < max0; i++) {
        for (var j = min1; j < max1; j++) {
          var grid = this.grid[this.i2toi1(i, j)];
          // for every marker in the grid
          for (var g = 0; g < grid.markers.length; g++) {
            var mark = grid.markers[g]
            // within personal bubble
            var dist = distance(mark.pos, agent.pos);
            if (dist < agent.radius) {
              claimed.push(mark);
              mark.owner = agent;
              if (mark.owner) {
                // choose closest owner
                var dist_old = distance(mark.owner.pos, mark.pos);
                if (dist_old > dist) mark.owner = agent;
              }
            }
          }
        }
      }
    }
    for (var c = 0; c < claimed.length; c++) {
      claimed[c].owner.markers.push(claimed[c]);
    }
  }

  update() {
    if (this.isPaused) return;
    // pick markers and compute velocity
    this.clear();
    this.select();

    // advect
    for (var i = 0; i < this.agents.length; i ++) {
      this.agents[i].update();
      this.agents[i].index = this.pos2i(this.agents[i].pos);
    }
  }

  pause() {
    this.isPaused = true;
  }

  play() {
    this.isPaused = false;
  }

  show() {
    this.scene.add( this.markerPoints );
    for (var i = 0; i < this.agents.length; i++) {
      this.scene.add(this.agents[i].lines);
      this.scene.add(this.agents[i].circle);
    }
  };

  hide() {
    this.scene.remove(this.markerPoints);
    for (var i = 0; i < this.agents.length; i++) {
      this.scene.remove(this.agents[i].lines);
      this.scene.remove(this.agents[i].circle)
    }
  };
}

// ------------------------------------------- //

class GridCell {

  constructor(pos, num, w, h, obs) {
    this.init(pos, num, w, h, obs);
  }

  init(pos, num, w, h, obs) {
    this.pos = pos;
    this.width = w;
    this.height = h;
    this.markers = [];
    this.obs = obs;
    this.scatter(num);

    var geo = new THREE.Geometry();
    var lineMat = new THREE.LineBasicMaterial( { color: 0x770000 } )
    
    geo.vertices.push(pos, 
      new THREE.Vector3(this.pos.x + w, this.pos.y, 0), 
      new THREE.Vector3(this.pos.x + w, this.pos.y + h, 0), 
      new THREE.Vector3(this.pos, this.pos.y + h, 0));
    this.square = new THREE.Line( geo, lineMat );

  }

  // stratified sampling
  scatter(num) {
    var sqrtVal = Math.floor(Math.sqrt(num));
    var invSqrtVal = 1.0 / sqrtVal;
    var samples = sqrtVal * sqrtVal;
    for (var i = 0; i < samples; i ++) {
      var y = i / sqrtVal;
      var x = i % sqrtVal;
      var loc = new THREE.Vector3((x + Math.random()) * invSqrtVal * this.width,
                         (y + Math.random()) * invSqrtVal * this.height,0);
      loc.add(this.pos)
      var obs_hit = false;
      for (var j = 0; j < this.obs.length; j++) {
        var x1 = this.obs[j].pos.x - loc.x; var y1 = this.obs[j].pos.y - loc.y;
        var dist = Math.sqrt(x1*x1 + y1*y1);
        if (dist < this.obs[j].radius) {
          obs_hit = true;
        }
      }
      if (!obs_hit) {
        var mark = new Marker(loc);
        this.markers.push(mark);
      }
    }
  }
}
