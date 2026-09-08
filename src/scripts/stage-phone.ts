// A landscape camera phone that becomes the next scene. Render targets exist only while mounted;
// the extra scene renders happen only during the short phone beat, never throughout the journey.
import { Scene, OrthographicCamera, PerspectiveCamera, Mesh, MeshBasicMaterial, ShaderMaterial, PlaneGeometry, CircleGeometry, RingGeometry, Group, WebGLRenderTarget, HalfFloatType, Vector2, type WebGLRenderer } from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { phoneAt, CLASSROOM_VIEW } from '../lib/stage/flight.ts';

export function createPhone(renderer: WebGLRenderer) {
  const scene = new Scene(), camera = new OrthographicCamera(-1, 1, 1, -1, 0.01, 10);
  camera.position.z = 5;
  const phone = new Group(); scene.add(phone);
  const photo = new WebGLRenderTarget(1024, 640, { type: HalfFloatType }), classroom = new WebGLRenderTarget(1024, 640, { type: HalfFloatType });
  const body = new Mesh(new RoundedBoxGeometry(1.72, 1.1, 0.065, 4, 0.07), new MeshBasicMaterial({ color: '#16191D', toneMapped: false }));
  phone.add(body);
  const material = new ShaderMaterial({
    uniforms: { photo: { value: photo.texture }, classroom: { value: classroom.texture }, blend: { value: 0 }, flash: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    // Offscreen targets hold linear HDR light. Match OutputPass for the classroom, while the
    // location photograph (like its MeshBasicMaterial in the window) keeps its original colour.
    fragmentShader: 'varying vec2 vUv; uniform sampler2D photo; uniform sampler2D classroom; uniform float blend; uniform float flash; void main(){vec3 arrival=texture2D(classroom,vUv).rgb;\n#ifdef TONE_MAPPING\narrival=toneMapping(arrival);\n#endif\nvec3 c=mix(texture2D(photo,vUv).rgb,arrival,blend);gl_FragColor=vec4(mix(c,vec3(1.0),flash*0.45),1.0);\n#include <colorspace_fragment>\n}',
    toneMapped: true,
  });
  const screen = new Mesh(new PlaneGeometry(1.6, 1), material); screen.position.z = 0.04; phone.add(screen);
  // Small camera-app controls, removed as the photograph fills the frame.
  const ui = new Group(); ui.position.z = 0.045; phone.add(ui);
  const white = new MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.85, toneMapped: false });
  const shutter = new Mesh(new CircleGeometry(0.038, 40), white); shutter.position.x = 0.7; ui.add(shutter);
  const rim = new Mesh(new RingGeometry(0.047, 0.051, 40), white); rim.position.x = 0.7; ui.add(rim);
  for (const x of [-0.28, 0.28]) for (const y of [-0.2, 0.2]) {
    const h = new Mesh(new PlaneGeometry(0.06, 0.005), white); h.position.set(x, y, 0); ui.add(h);
    const v = new Mesh(new PlaneGeometry(0.005, 0.06), white); v.position.set(x, y, 0); ui.add(v);
  }
  const captureCamera = new PerspectiveCamera();
  let visible = false, lastAspect = 0;
  return {
    update(q: number, aspect: number, reduced: boolean, capture: (kind: 'photo' | 'classroom', camera: PerspectiveCamera, target: WebGLRenderTarget) => void) {
      const state = phoneAt(q, reduced); visible = state.visible;
      if (!visible) return;
      if (aspect !== lastAspect) {
        lastAspect = aspect;
        const width = Math.min(1440, Math.round(renderer.getSize(new Vector2()).x)), height = Math.round(width / aspect);
        photo.setSize(width, height); classroom.setSize(width, height);
      }
      camera.left = -aspect; camera.right = aspect; camera.updateProjectionMatrix();
      screen.scale.y = 1.6 / aspect;
      body.scale.y = (1.6 / aspect + 0.1) / 1.1;
      captureCamera.aspect = aspect;
      captureCamera.fov = Math.min(40, 2 * Math.atan(Math.tan(60 * Math.PI / 360) / aspect) * 180 / Math.PI);
      captureCamera.near = 0.05; captureCamera.far = 1000; captureCamera.updateProjectionMatrix();
      captureCamera.position.set(-5.5, 4.6, -6.55); captureCamera.lookAt(-20, 4.6, -6);
      capture('photo', captureCamera, photo);
      captureCamera.fov = 2 * Math.atan(Math.tan(CLASSROOM_VIEW.fov * Math.PI / 360) / aspect) * 180 / Math.PI;
      captureCamera.updateProjectionMatrix();
      captureCamera.position.set(...CLASSROOM_VIEW.cam); captureCamera.lookAt(...CLASSROOM_VIEW.look);
      capture('classroom', captureCamera, classroom);
      const startScale = Math.min(0.88, aspect * 0.7), fullScale = 2 * aspect / 1.6;
      phone.scale.setScalar(startScale + (fullScale - startScale) * state.zoom);
      phone.position.set((1 - state.zoom) * Math.min(0.18, aspect * 0.15), (1 - state.raise) * -2.5, 0);
      phone.rotation.z = (1 - state.raise) * -0.12;
      ui.visible = state.zoom < 0.5;
      material.uniforms.blend.value = state.classroom;
      material.uniforms.flash.value = state.flash;
    },
    render() {
      if (!visible) return;
      const clear = renderer.autoClear;
      renderer.autoClear = false; renderer.clearDepth(); renderer.render(scene, camera); renderer.autoClear = clear;
    },
    dispose() {
      photo.dispose(); classroom.dispose();
      scene.traverse((o) => { if (o instanceof Mesh) o.geometry.dispose(); });
      body.material.dispose(); material.dispose(); white.dispose();
    },
  };
}
