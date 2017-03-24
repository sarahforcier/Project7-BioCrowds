const THREE = require('three');


function Marker(pos) {
  this.pos = pos;
  this.owner = null;
}

function Agent(pos, i, vel, ori, goal, radius) {
  this.pos = pos;
  this.index = i;
  this.vel = vel;
  this.ori = ori;
  this.goal = goal;
  this.radius = size;
  this.markers = [];
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
    this.maxMarkers = App.maxMarkers;
    this.gridRes = App.gridRes;
    this.gridRes2 = this.gridRes * this.gridRes;
    this.cellRes = Math.floor(this.maxMarkers / this.gridRes2);
    this.cellHeight = App.cellHeight;
    this.cellWidth = App.cellWidth;

    // agents
    this.agents = [];
    this.numAgents = App.numAgents;
    this.agentRadius = App.agentRadius;
    this.dest = App.destination;
    this.velocity = App.velocity;
   
    // scene data
    this.camera = App.camera;
    this.scene = App.scene;

    this.debug = App.config.visualDebug;
    // markers 
    this.markerGeo = new THREE.Geometry();
    this.markerMat = new THREE.PointsMaterial( { color: 0x7eed6f } )
    this.markerPoints = new THREE.Points( markerGeo, markerMat );
    this.markerPoints.geometry.verticesNeedUpdate = true;
    // lines 
    this.lineGeo = new THREE.Geometry();
    this.lineMat = new THREE.LineBasicMaterial( { color: 0x770000 } )
    this.lines = new THREE.LineSegments( lineGeo, lineMat );
    this.lines.geometry.verticesNeedUpdate = true;
  };

  // new grid and agents
  reset() {
    this.agents = [];
    this.markers = [];
    this.initGrid();
    this.initAgents();
  };

  // Convert from 1D index to 2D indices
  i1toi2(i1) { return [i1 % this.gridRes, ~~ ((i1 % this.res2) / this.res)];};

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
    return i2toi1(x, y);
  };

  initGrid() {
    for (var i = 0; i < this.res2; i++) {
      var i2 = this.i1toi2(i);
      var pos = this.i2toPos(i2);
      var cell = new GridCell(pos, this.cellRes, this.cellWidth, this.cellHeight);
      this.grid.push(cell);
      for (var j = 0; j < cell.markers.length; j++) {
        this.markerGeo.vertices.push(pos);
      }
    }
  }

  initAgents() {
    for (var i = 0; i < this.numAgents; i ++) {
      var pos = new THREE.Vector2(Math.rand() * this.gridRes * this.cellWidth,
                                  Math.rand() * this.gridRes * this.cellHeight);
      pos.add(this.origin);
      var i = this.pos2i(pos);
      var vel = this.velocity;
      var ori = Math.atan2(this.dest.y - pos.y, this.dest.x - pos.x);
      var agent = new Agent(pos, i, vel, ori, this.dest, this.agentRadius);
      select(agent);
      this.agents.push(agent);
    }
  }

  // disassociate markers and agents
  clear() {
    for (var i = 0; i < this.agents.length; i ++) {
      for (var j = 0; j < this.agents[i].markers.length; j ++) {
        this.agents[i].markers[j] = null;
      }
      this.agents[i].markers = [];
    }
    this.lines.geometry = [];
  }

  select(agent) {
    // check neighboring grid cells
    var i2 = this.i1toi2(toiagent.index);
    for (var i = i2.x - 1; i < i2.x + 2; i ++) {
      for (var j = i2.y - 1; j < i2.y + 2; j++, x++) {
        var grid = this.grid[i2toi1(i, j)];
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
              agent.markers.push(mark);
              this.lines.geometry.push(new THREE.Vector3(mark.pos.x, mark.pos.y, 0));
              this.lines.geometry.push(new THREE.Vector3(agent.pos.x, agent.pos.y, 0));
            }
          }
        }
      }
    }
  }

  update() {
    if (this.isPaused) return;
    this.clear();
    // TODO update pos and velocity

    // pick markers
    for (var i = 0; i < this.agents.length; i ++) {
      this.select(this.agents[i]);

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
    var sqrtVal = Math.floor(Math::sqrt(num) + 0.5);
    var invSqrtVal = 1.0 / sqrtVal;
    var samples = sqrtVal * sqrtVal;
    for (var i = 0; i < samples; i ++) {
        var y = i / sqrtVal;
        var x = i % sqrtVal;
        var loc = new THREE.Vector2((x + rng.nextFloat()) * invSqrtVal * width,
                           (y + rng.nextFloat()) * invSqrtVal * height);
        var mark = new Marker(loc.add(this.pos));
        this.markers.push(mark);
    }
  }
}
