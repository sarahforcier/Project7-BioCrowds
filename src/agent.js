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
    this.lines = new THREE.LineSegments( this.lineGeo, l_mat );
    this.lineGeo.addAttribute('position', new THREE.BufferAttribute(this.l_positions, 3));
    
    this.lines.geometry.attributes.position.dynamic = true;
    this.lines.geometry.dynamic = true;

    var geometry = new THREE.CircleGeometry( this.radius, 16 );
    var material = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
    this.circle = new THREE.Mesh( geometry, material );
    this.circle.position.set(pos.x, pos.y,0);
    this.circle.geometry.verticesNeedUpdate = true;
  }

  update () {
    // update velocity
    this.l_positions.fill(0);
    var weight = 0; var ind = 0;
    for (var i = 0; i < this.markers.length; i ++) {
      var mark = this.markers[i];
      var x = mark.pos.x - this.pos.x; var y = mark.pos.y - this.pos.y;
      var dist = Math.sqrt(x*x + y*y);

      var G = (this.goal).clone().sub(this.pos).normalize();
      var m = (mark.pos).clone().sub(this.pos);
      var theta = G.dot((m.clone()).normalize());
      mark.weight = (1 + theta) / (1 + dist);
      weight += mark.weight;
      this.vel.add(m.multiplyScalar(mark.weight));
      
      this.l_positions[ind++] = mark.pos.x; this.l_positions[ind++] = mark.pos.y; this.l_positions[ind++] = 0;
      this.l_positions[ind++] = this.pos.x; this.l_positions[ind++] = this.pos.y; this.l_positions[ind++] = 0;
    }
    this.vel.divideScalar(this.markers.length * weight);
    this.vel.clampLength(-this.radius, this.radius);

    // update position
    this.pos.add(this.vel);
    this.mesh.position.set(this.pos.x, this.pos.y, 0);
    this.circle.position.set(this.pos.x, this.pos.y, 0);
    this.lines.geometry.setDrawRange(0,  2.0 * this.markers.length);
    this.lines.geometry.attributes.position.needsUpdate = true;
  }
}
