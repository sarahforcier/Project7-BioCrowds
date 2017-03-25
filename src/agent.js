const THREE = require('three')

export default class Agent {
  constructor(pos, i, ori, goal, radius, geo, mat, l_mat,max) {
    this.init(pos, i, ori, goal, radius, geo, mat, l_mat,max);
  }

  init (pos, i, ori, goal, radius, geo, mat, l_mat,max) {
    this.pos = pos;
    this.index = i;
    this.vel = new THREE.Vector3(0,0,0);
    this.ori = ori;
    this.goal = goal;
    this.radius = radius;
    this.markers = [];

    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.set(pos.x, pos.y, 0);
    this.mesh.geometry.verticesNeedUpdate = true;

    this.lineGeo = new THREE.BufferGeometry();
    this.l_positions = new Float32Array(max * 3);
    this.lines = new THREE.Line( this.lineGeo, l_mat );
    this.lineGeo.addAttribute('position', new THREE.BufferAttribute(this.l_positions, 3));
    this.lines.geometry.attributes.position.dynamic = true;
  }
}
