// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require("three");
// Include any additional ThreeJS examples below
require("three/examples/js/controls/OrbitControls");
const Stats = require("stats.js");

const canvasSketch = require("canvas-sketch");
const glslify = require("glslify");

const { mat4, vec3 } = require("gl-matrix");

const settings = {
  dimensions: [512, 512],
  // Make the loop animated
  animate: true,
  // Get a WebGL canvas rather than 2D
  context: "webgl",

  attributes: {
    antialias: true,
  },
};

const sketch = ({ context }) => {
  // Create a renderer
  const stats = new Stats();
  document.body.appendChild(stats.dom);
  const renderer = new THREE.WebGLRenderer({
    canvas: context.canvas,
  });

  // WebGL background color
  renderer.setClearColor("#000", 1);

  // Setup a camera
  const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 100);
  camera.position.set(0, 0, -4);
  camera.lookAt(new THREE.Vector3());

  // Setup camera controller
  const controls = new THREE.OrbitControls(camera, context.canvas);

  // Setup your scene
  const scene = new THREE.Scene();

  const fragmentShader = glslify(/* glsl */ `
    #pragma glslify: hsl2rgb = require('glsl-hsl2rgb');

    varying vec2 vUv;
    uniform float playhead;

    void main () {
      // number of horizontal bands
      float bands = 12.0;

      // offset texture by loop time
      float offset = playhead;

      // get a 0..1 value from this
      float y = mod(offset + vUv.y, 1.0);

      // get N discrete steps of hue
      float hue = floor(y * bands) / bands;

      // now get a color
      float sat = 0.55;
      float light = 0.6;
      vec3 color = hsl2rgb(hue, sat, light);

      gl_FragColor = vec4(color, 1.0);
    }
  `);

  const vertexShader = glslify(/* glsl */ `
    varying vec2 vUv;
    void main () {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xyz, 1.0);
    }
  `);

  const mesh = new THREE.Mesh(
    new THREE.TorusGeometry(10, 3, 30, 3, 2.3310608608067),

    new THREE.ShaderMaterial({
      fragmentShader,
      vertexShader,
      uniforms: {
        playhead: { value: 0 },
      },
      ske,
    })
  );

  // Setup a geometry
  // const geometry2 = new THREE.SphereGeometry(1, 32, 16);
  // const geometry = new THREE.TorusGeometry(10, 3, 30, 3, 2.3310608608067);
  const torusgeometry = new THREE.TorusKnotGeometry(
    12, //radius
    6, //tube
    64, //tubularSegments
    8, //radialSegments
    2,
    3 //
  );

  // // Setup a material
  // const material = new THREE.MeshBasicMaterial({
  //   color: "blue",
  //   wireframe: true,
  //   blending: THREE.AdditiveBlending,
  // });

  // Setup a mesh with geometry + material

  // Setup Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  const pointLight = new THREE.PointLight(0xffffff, 1);
  pointLight.position.set(2, 2, -4).multiplyScalar(1.25);

  pointLight.position.set(50, 50, 50);

  // scene.add(boxMesh);
  scene.add(mesh);
  scene.add(ambientLight);
  scene.add(pointLight);

  // draw each frame
  return {
    // Handle resize events here
    resize({ pixelRatio, viewportWidth, viewportHeight }) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(viewportWidth, viewportHeight, false);
      camera.aspect = viewportWidth / viewportHeight;
      camera.updateProjectionMatrix();
    },
    // Update & render your scene here
    render({ time, deltaTime }) {
      let playhead = mesh.material.uniforms.playhead.value;
      playhead += time * 0.5;
      console.log("🚀 ~ render ~ playhead:", playhead);
      controls.update();
      renderer.render(scene, camera);
    },
    // Dispose of events & renderer for cleaner hot-reloading
    unload() {
      controls.dispose();
      renderer.dispose();
    },
  };
};

canvasSketch(sketch, settings);
