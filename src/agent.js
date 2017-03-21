const THREE = require('three')

export default class Agent {
  constructor(pos, vel, goal, ori, size, markers) {
    this.init(pos, vel, goal, ori, size, markers);
  }

  init(pos, vel, goal, ori, size, markers) {
    this.pos = pos;
    this.vel = vel;
    this.goal = goal;
    this.ori = ori;
    this.size = size;
    this.markers = markers;
  }

  update() {

  }
