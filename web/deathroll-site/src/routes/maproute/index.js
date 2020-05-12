import { h, Component } from 'preact';
import style from './style';
import { listTowns } from '../../api';
import * as THREE from 'three';

import townTex from '../../assets/img/town.png';
import grassTex from '../../assets/img/grass.png';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';


export default class MapRoute extends Component {
  townTexURL = 'https://cdn.discordapp.com/attachments/668497531742978100/677623504799006740/unknown.png';

  state = {
	towns: null,
	worldWidth: 1000,
	worldHeight: 1000,
  };

  // gets called when this route is navigated to
  componentDidMount() {

	// === THREE.JS CODE START ===
	var scene = new THREE.Scene();
	var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
    this.camera = camera;
	var renderer = new THREE.WebGLRenderer();

    this.renderer = renderer;

	renderer.setSize( window.innerWidth, window.innerHeight );
	this.mount.appendChild( renderer.domElement );

	var grass = new THREE.TextureLoader().load(grassTex);
    grass.repeat.set(700, 700);
	grass.minFilter = THREE.LinearFilter;
	grass.magFilter = THREE.NearestFilter;
	grass.wrapS = THREE.RepeatWrapping;
	grass.wrapT = THREE.RepeatWrapping;

	var geometry =  new THREE.PlaneGeometry(2000, 2000);
    var material = new THREE.MeshBasicMaterial( { map: grass } );
	var cube = new THREE.Mesh( geometry, material );
    cube.rotateX(-Math.PI * 0.5);


	scene.add( cube );
	camera.position.z = 5;
    camera.position.y = 5;
    camera.lookAt(0, 0, 0);
    cube.position.y = -0.5;

    const scale = 0.2;

	var texture = new THREE.TextureLoader().load(townTex);
	texture.minFilter = THREE.NearestFilter;
	texture.wrapS = THREE.ClampToEdgeWrapping;
	texture.wrapT = THREE.ClampToEdgeWrapping;

	const labelMaterial = new THREE.SpriteMaterial({
	  map: texture,
	  side: THREE.DoubleSide,
	  transparent: true,
	});

    var controls = new OrbitControls( camera, renderer.domElement );
    controls.mouseButtons = { LEFT: THREE.MOUSE.PAN };
    controls.enableRotate = false;
    controls.minDistance = 5;
    controls.maxDistance = 100;
    controls.distance = 5;
    controls.touches = {
      ONE: THREE.TOUCH.PAN,
      TWO: THREE.TOUCH.DOLLY_PAN,
    };

    var townObjs = {};

	listTowns(this.props.id).then(towns => {
	  towns.towns.forEach(town => {
		const t = new THREE.Sprite(labelMaterial);
		t.position.y = 0;
		t.position.z = town.y * scale;
		t.position.x = town.x * scale;
        townObjs[town.id] = t;
		scene.add(t);
	  });

      if (this.props.town) {
        const info = towns.towns.find(t => t.id == this.props.town);
        if (info) {
          camera.position.set(info.x * scale, 5, info.y * scale + 5);
          controls.target.set(info.x * scale, 0, info.y * scale);
          controls.update();
        }
      }

	  this.setState({
		towns: towns.towns
	  });
	});

    this.townObjs = townObjs;

    window.addEventListener('resize', this.onResize);

	this.onResize();

    this.townLabels = {};

    var animate = () => {
	  requestAnimationFrame( animate );
	  renderer.render( scene, camera );

      for (const id in this.townLabels) {
        const label = this.townLabels[id];
        const townObj = this.townObjs[id];

        if (!label || !townObj) {
          continue;
        }

		let pos = new THREE.Vector3();
		pos = pos.setFromMatrixPosition(townObj.matrixWorld);
        pos.z += 1;
		pos.project(camera);

		let widthHalf = this.canvasWidth / 2;
		let heightHalf = this.canvasHeight / 2;

		pos.x = (pos.x * widthHalf) + widthHalf;
		pos.y = - (pos.y * heightHalf) + heightHalf;
		pos.z = 0;
        label.style.left = `${pos.x}px`;
        label.style.top = `${pos.y}px`;
      }
	};
    animate = animate.bind(this);
	animate();
  }

  onResize = (e) => {
	this.renderer.setSize( window.innerWidth, window.innerHeight );
	this.camera.aspect = window.innerWidth/window.innerHeight;
    this.camera.updateProjectionMatrix();
	this.canvasWidth = window.innerWidth;
	this.canvasHeight = window.innerHeight;
  }

  // gets called just before navigating away from the route
  componentWillUnmount() {
    window.removeEventListener('resize', this.onResize);
	this.mount.removeChild( this.renderer.domElement );
  }

  // Note: `user` comes from the URL, courtesy of our router
  render({ id, town }, { towns, worldWidth, worldHeight }) {
	return (
	  <div class={style.map} ref={ ref => (this.mount = ref) }>
		{towns && towns.map(town => {
          return <div class={style.townLabel} ref={ ref => (this.townLabels[town.id] = ref) }>
            <div class={style.label}>
			  {town.name}
            </div>
		  </div>
		})}
		{false && towns && towns.map(town => {
		  return <div class={style.town} style={{ top: ((town.y / worldHeight) * 100) + '%', left: ((town.x / worldWidth) * 100) + '%' }}>
			<img src={townTex} />
			{town.name}
		  </div>
		})}
	  </div>
	);
  }
}
