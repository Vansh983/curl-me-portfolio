// Fixed-proportion 3D handset. Its screen is the classroom from the first visible frame.
import { Scene, OrthographicCamera, PerspectiveCamera, Mesh, MeshBasicMaterial, MeshStandardMaterial, MeshPhysicalMaterial, ShaderMaterial, PlaneGeometry, CircleGeometry, Group, WebGLRenderTarget, HalfFloatType, Vector2, DirectionalLight, HemisphereLight, Shape, ExtrudeGeometry, CanvasTexture, SRGBColorSpace, type WebGLRenderer } from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { phoneAt, CLASSROOM_VIEW, phoneLayout } from '../lib/stage/flight.ts';

export function createPhone(renderer: WebGLRenderer) {
  const scene = new Scene(), camera = new OrthographicCamera(-1, 1, 1, -1, .01, 10);
  camera.position.z = 5;
  scene.add(new HemisphereLight('#EDF6FF', '#394452', 2));
  const key = new DirectionalLight('#FFFFFF', 3); key.position.set(-3, 5, 4); scene.add(key);
  const phone = new Group(); scene.add(phone);
  const target = new WebGLRenderTarget(1024, 640, { type: HalfFloatType });
  // a titanium frame with a real bevel so the key light runs round its edge, black glass in it, the buttons on the sides
  const metal = new MeshPhysicalMaterial({ color: '#4E555E', metalness: .85, roughness: .3, clearcoat: .6, clearcoatRoughness: .25 });
  const black = new MeshBasicMaterial({ color: '#080B0F', toneMapped: false });
  const white = new MeshBasicMaterial({ color: '#CED5DD', toneMapped: false });
  const rounded = (w: number, h: number, d: number, r: number, mat: typeof metal | typeof black, at: [number, number, number], bevel = 0) => {
    const shape = new Shape(), x=w/2-bevel, y=h/2-bevel, radius=Math.min(r,x,y);
    shape.moveTo(-x+radius,-y); shape.lineTo(x-radius,-y);
    shape.absarc(x-radius,-y+radius,radius,-Math.PI/2,0,false); shape.lineTo(x,y-radius);
    shape.absarc(x-radius,y-radius,radius,0,Math.PI/2,false); shape.lineTo(-x+radius,y);
    shape.absarc(-x+radius,y-radius,radius,Math.PI/2,Math.PI,false); shape.lineTo(-x,-y+radius);
    shape.absarc(-x+radius,-y+radius,radius,Math.PI,Math.PI*1.5,false);
    const geometry=new ExtrudeGeometry(shape,{depth:d-2*bevel,bevelEnabled:bevel>0,bevelSize:bevel,bevelThickness:bevel,bevelSegments:3,curveSegments:14}); geometry.translate(0,0,-(d-2*bevel)/2);
    const mesh=new Mesh(geometry,mat); mesh.position.set(...at); phone.add(mesh); return mesh;
  };
  rounded(.774, 1.634, .064, .055, metal, [0,0,0], .012);
  rounded(.754, 1.614, .025, .06, black, [0,0,.034]);
  rounded(.015,.17,.035,.006,metal,[.389,.25,0]);
  for (const y of [.25,.43]) rounded(.015,.12,.035,.006,metal,[-.389,y,0]);
  const material = new ShaderMaterial({
    uniforms: { classroom: { value: target.texture }, crop: { value: new Vector2(1,1) }, reflection: { value: 1 } },
    vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: `varying vec2 vUv; uniform sampler2D classroom; uniform vec2 crop; uniform float reflection;
      void main(){
        vec2 edge=abs(vUv-.5)*vec2(.7,1.5)-vec2(.35-.045,.75-.045);
        if(length(max(edge,0.0))+min(max(edge.x,edge.y),0.0)>.045) discard;
        vec3 c=texture2D(classroom,(vUv-.5)*crop+.5).rgb;
        #ifdef TONE_MAPPING
          c=toneMapping(c);
        #endif
        // the glass: a soft sheen from the cabin window across the top left, and a diagonal band of it
        float band=exp(-pow((vUv.x*.9+vUv.y*.35-.62)*9.0,2.0));
        c+=vec3(.018,.025,.032)*reflection*pow(max(0.0,1.0-vUv.x*.6-vUv.y*.3),4.0)+vec3(.05,.06,.07)*reflection*band;
        gl_FragColor=vec4(c,1.0);
        #include <colorspace_fragment>
      }`, toneMapped: true,
  });
  const screen = new Mesh(new PlaneGeometry(.7,1.5), material); screen.position.z=.049; phone.add(screen);
  const hardware = new Group(); hardware.position.z=.055; phone.add(hardware);
  const island = new Mesh(new RoundedBoxGeometry(.19,.05,.008,3,.024),black); island.position.y=.68; hardware.add(island); // the camera island
  const lens = new Mesh(new CircleGeometry(.012,32),metal); lens.position.set(.05,.68,.005); hardware.add(lens);
  const home = new Mesh(new PlaneGeometry(.17,.006),white); home.position.y=-.722; hardware.add(home);
  // the status bar, drawn once: the time, the signal, the battery
  const bar = document.createElement('canvas'); bar.width=560; bar.height=48;
  const bx = bar.getContext('2d')!; bx.clearRect(0,0,560,48); bx.fillStyle='#FFFFFF'; bx.font='600 30px Inter, system-ui, sans-serif'; bx.fillText('15:42',26,35);
  for (let i=0;i<4;i++) bx.fillRect(408+i*11,30-i*5,7,6+i*5);
  bx.strokeStyle='#FFFFFFAA'; bx.lineWidth=2.5; bx.strokeRect(466,13,60,24); bx.fillRect(529,20,5,10); bx.fillRect(470,17,44,16);
  const barTex = new CanvasTexture(bar); barTex.colorSpace=SRGBColorSpace;
  const status = new Mesh(new PlaneGeometry(.7,.06), new MeshBasicMaterial({ map: barTex, transparent: true, toneMapped: false })); status.position.set(0,.712,.001); hardware.add(status);
  const captureCamera = new PerspectiveCamera();
  let visible=false, lastAspect=0, screenExposure=1;
  const fitTarget = (aspect: number) => {
    if (aspect === lastAspect) return;
    lastAspect = aspect;
    const width = Math.min(1440, Math.round(renderer.getSize(new Vector2()).x));
    target.setSize(width, Math.round(width / aspect));
  };
  return {
    async prepare() {
      const size = renderer.getSize(new Vector2());
      fitTarget(size.x / size.y);
      renderer.initRenderTarget(target);
      renderer.initTexture(barTex);
      await renderer.compileAsync(scene, camera);
      const previous = renderer.getRenderTarget(), warm = new WebGLRenderTarget(8, 8);
      renderer.setRenderTarget(warm); renderer.render(scene, camera); renderer.setRenderTarget(previous);
      warm.dispose();
    },
    update(q: number, aspect: number, reduced: boolean, capture: (camera: PerspectiveCamera, target: WebGLRenderTarget) => void) {
      const state=phoneAt(q,reduced); visible=state.visible; if(!visible) return;
      fitTarget(aspect);
      camera.left=-aspect; camera.right=aspect; camera.updateProjectionMatrix();
      captureCamera.position.set(...CLASSROOM_VIEW.cam); captureCamera.lookAt(...CLASSROOM_VIEW.look);
      capture(captureCamera,target);
      screenExposure=renderer.toneMappingExposure;
      const layout=phoneLayout(aspect,state.raise,state.zoom);
      phone.scale.setScalar(layout.scale); phone.position.set(layout.x,layout.y,0);
      phone.rotation.set(-.12*(1-state.zoom), .24*(1-state.zoom), -.065*(1-state.zoom));
      hardware.visible=state.zoom<.75;
      material.uniforms.crop.value.set(...layout.crop);
      material.uniforms.reflection.value=1-state.zoom;
    },
    render(){
      if(!visible) return;
      const clear=renderer.autoClear, exposure=renderer.toneMappingExposure;
      renderer.autoClear=false; renderer.toneMappingExposure=screenExposure;
      renderer.clearDepth(); renderer.render(scene,camera);
      renderer.autoClear=clear; renderer.toneMappingExposure=exposure;
    },
    dispose(){
      target.dispose(); scene.traverse(o=>{if(o instanceof Mesh)o.geometry.dispose();});
      metal.dispose(); black.dispose(); white.dispose(); material.dispose(); barTex.dispose(); (status.material as MeshBasicMaterial).dispose();
    },
  };
}
