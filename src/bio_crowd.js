const THREE = require('three');

function Marker(pos) {
  this.pos = pos;
  this.weight = 0;
  this.owner = null;
}

function Agent(pos, i, ori, goal, radius, geo, mat) {
  this.pos = pos;
  this.index = i;
  this.vel = new THREE.Vector2(0,0);
  this.ori = ori;
  this.goal = goal;
  this.radius = radius;
  this.markers = [];
  this.mesh = new THREE.Mesh(geo, mat);
  this.mesh.geometry.verticesNeedUpdate = true;
}

export default class BioCrowd {

  constructor(App) {
    this.init(App);
  }

  init(App) {
    this.isPaused = false;
    this.origin = new THREE.Vector2(0);

    // dimensions
    this.grid = [];
    this.maxMarkers = App.config.maxMarkers;
    this.gridRes = App.config.gridRes;
    this.gridRes2 = this.gridRes * this.gridRes;
    this.cellRes = Math.floor(this.maxMarkers / this.gridRes2);
    this.cellHeight = App.config.cellHeight;
    this.cellWidth = App.config.cellWidth;

    // agents
    this.agents = [];
    this.numAgents = App.config.numAgents;
    this.agentRadius = App.config.agentRadius;
    this.dest = App.config.destination;
    this.maxVel = App.config.maxVelocity;
    this.agentGeo = App.agentGeometry;
    this.agentMat = App.agentMaterial;
   
    // scene data
    this.camera = App.camera;
    this.scene = App.scene;

    this.debug = App.config.visualDebug;
    // markers 
    this.markerGeo = new THREE.Geometry();
    this.markerMat = new THREE.PointsMaterial( { size: 0.01, color: 0x7eed6f } )
    this.markerPoints = new THREE.Points( this.markerGeo, this.markerMat );
    this.markerPoints.geometry.verticesNeedUpdate = true;
    // lines 
    this.lineGeo = new THREE.Geometry();
    this.lineMat = new THREE.LineBasicMaterial( { color: 0x770000 } )
    this.lines = new THREE.LineSegments( this.lineGeo, this.lineMat );
    this.lines.geometry.verticesNeedUpdate = true;

    this.initGrid();
    this.initAgents();
    this.show();
  };

  // new grid and agents
  reset() {
    this.agents = [];
    this.markers = [];
    this.initGrid();
    this.initAgents();
  };

  // Convert from 1D index to 2D indices
  i1toi2(i1) { return [i1 % this.gridRes, ~~ ((i1 % this.gridRes2) / this.gridRes)];};

  // Convert from 2D indices to 1D
  i2toi1(ix, iy) { return ix + iy * this.gridRes; };

  // Convert from 2D indices to 2D positions
  i2toPos(i2) {
    return new THREE.Vector2(
      i2[0] * this.cellWidth + this.origin.x,
      i2[1] * this.cellHeight + this.origin.y,
    );
  };

  // Convert from position to 2D indices
  pos2i(vec2) {
    var x = Math.floor((vec2.x - this.origin.x) / this.cellWidth);
    var y = Math.floor((vec2.y - this.origin.y) / this.cellHeight);
    return this.i2toi1(x, y);
  };

  initGrid() {
    for (var i = 0; i < this.gridRes2; i++) {
      var i2 = this.i1toi2(i);
      var pos = this.i2toPos(i2);
      var cell = new GridCell(pos, this.cellRes, this.cellWidth, this.cellHeight);
      this.grid.push(cell);
      for (var j = 0; j < cell.markers.length; j++) {
        this.markerGeo.vertices.push(new THREE.Vector3(cell.markers[j].pos.x, cell.markers[j].pos.y, 0));
      }
    }
  }

  initAgents() {
    for (var i = 0; i < this.numAgents; i ++) {
      var pos = new THREE.Vector2(Math.random() * this.gridRes * this.cellWidth,
                                  Math.random() * this.gridRes * this.cellHeight);
      pos.add(this.origin);
      var i = this.pos2i(pos);
      var ori = Math.atan2(this.dest.y - pos.y, this.dest.x - pos.x);
      var agent = new Agent(pos, i, ori, this.dest, this.agentRadius, this.agentGeo, this.agentMat);
      this.select(agent);
      this.agents.push(agent);
      this.scene.add(agent.mesh);
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
    this.lineGeo.vertices = [];
  }

  select(agent) {
    // check neighboring grid cells
    var i2 = this.i1toi2(agent.index);
    var weight = 0;
    for (var i = i2.x - 1; i < i2.x + 2; i ++) {
      for (var j = i2.y - 1; j < i2.y + 2; j++, x++) {
        var grid = this.grid[this.i2toi1(i, j)];
        // for every marker in the grid
        for (var g = 0; g < grid.markers.length; g++) {
          var mark = grid.markers[g]
          // no owner
          if (mark) {
            // within personal bubble
            var x = mark.pos.x - agent.pos.x; var y = mark.pos.y - agent.pos.y;
            var dist = Math.sqrt(x*x + y*y);
            if (dist < agent.radius) {
              mark.owner = agent;
              var dest = agent.goal.clone().sub(agent.pos).normalize();
              var m = mark.pos.clone().sub(agent.pos);
              mark.weight = (1 + dest.dot(m.clone().normalize())) / (1 + dist);
              weight += mark.weight;
              agent.vel.add(m.multiplyScalar(mark.weight * m));
              agent.markers.push(mark);
              this.lineGeo.vertices.push(new THREE.Vector3(mark.pos.x, mark.pos.y, 0));
              this.lineGeo.vertices.push(new THREE.Vector3(agent.pos.x, agent.pos.y, 0));
            }
          }
        }
      }
    }
    agent.vel.divideScalar(agent.markers.length * weight);
    agent.vel.clampScalar(0, this.maxVel);
  }

  update() {
    if (this.isPaused) return;
    // pick markers and compute velocity
    this.clear();
    for (var i = 0; i < this.agents.length; i ++) {
      this.select(this.agents[i]);
    }
    // advect
    for (var i = 0; i < this.agents.length; i ++) {
      this.agents[i].pos.add(this.agents[i].vel);
      this.agents[i].mesh.geometry.translate(this.agents[i].vel.x, this.agents[i].vel.y, this.agents[i].vel.z);
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
    this.scene.add( this.lines );
  };

  hide() {
    this.scene.remove(this.markerPoints);
    this.scene.remove(this.lines);
  };
}

// ------------------------------------------- //

class GridCell {

  constructor(pos, num, w, h) {
    this.init(pos, num, w, h);
  }

  init(pos, num, w, h) {
    this.pos = pos;
    this.width = w;
    this.height = h;
    this.markers = [];
    this.scatter(num);
  }

  // stratified sampling
  scatter(num) {
    var sqrtVal = Math.floor(Math.sqrt(num) + 0.5);
    var invSqrtVal = 1.0 / sqrtVal;
    var samples = sqrtVal * sqrtVal;
    for (var i = 0; i < samples; i ++) {
        var y = i / sqrtVal;
        var x = i % sqrtVal;
        var loc = new THREE.Vector2((x + Math.random()) * invSqrtVal * this.width,
                           (y + Math.random()) * invSqrtVal * this.height);
        var mark = new Marker(loc.add(this.pos));
        this.markers.push(mark);
    }
  }
}
