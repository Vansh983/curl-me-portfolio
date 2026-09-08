// Fixed-proportion 3D handset. Its screen is the classroom from the first visible frame.
import { Scene, OrthographicCamera, PerspectiveCamera, Mesh, MeshBasicMaterial, MeshStandardMaterial, ShaderMaterial, PlaneGeometry, CircleGeometry, Group, WebGLRenderTarget, HalfFloatType, Vector2, DirectionalLight, HemisphereLight, Shape, ExtrudeGeometry, type WebGLRenderer } from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { phoneAt, CLASSROOM_VIEW, phoneLayout } from '../lib/stage/flight.ts';

export function createPhone(renderer: WebGLRenderer) {
  const scene = new Scene(), camera = new OrthographicCamera(-1, 1, 1, -1, .01, 10);
  camera.position.z = 5;
  scene.add(new HemisphereLight('#EDF6FF', '#394452', 2));
  const key = new DirectionalLight('#FFFFFF', 3); key.position.set(-3, 5, 4); scene.add(key);
  const phone = new Group(); scene.add(phone);
  const target = new WebGLRenderTarget(1024, 640, { type: HalfFloatType });
  const metal = new MeshStandardMaterial({ color: '#5E6670', metalness: .8, roughness: .26 });
  const black = new MeshBasicMaterial({ color: '#080B0F', toneMapped: false });
  const white = new MeshBasicMaterial({ color: '#CED5DD', toneMapped: false });
  const rounded = (w: number, h: number, d: number, r: number, mat: typeof metal | typeof black, at: [number, number, number]) => {
    const shape = new Shape(), x=w/2, y=h/2, radius=Math.min(r,x,y);
    shape.moveTo(-x+radius,-y); shape.lineTo(x-radius,-y);
    shape.absarc(x-radius,-y+radius,radius,-Math.PI/2,0,false); shape.lineTo(x,y-radius);
    shape.absarc(x-radius,y-radius,radius,0,Math.PI/2,false); shape.lineTo(-x+radius,y);
    shape.absarc(-x+radius,y-radius,radius,Math.PI/2,Math.PI,false); shape.lineTo(-x,-y+radius);
    shape.absarc(-x+radius,-y+radius,radius,Math.PI,Math.PI*1.5,false);
    const geometry=new ExtrudeGeometry(shape,{depth:d,bevelEnabled:false,curveSegments:12}); geometry.translate(0,0,-d/2);
    const mesh=new Mesh(geometry,mat); mesh.position.set(...at); phone.add(mesh); return mesh;
  };
  rounded(.774, 1.634, .064, .055, metal, [0,0,0]);
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
        c+=vec3(.018,.025,.032)*reflection*pow(max(0.0,1.0-vUv.x*.6-vUv.y*.3),4.0);
        gl_FragColor=vec4(c,1.0);
        #include <colorspace_fragment>
      }`, toneMapped: true,
  });
  const screen = new Mesh(new PlaneGeometry(.7,1.5), material); screen.position.z=.049; phone.add(screen);
  const hardware = new Group(); hardware.position.z=.055; phone.add(hardware);
  const speaker = new Mesh(new RoundedBoxGeometry(.15,.025,.008,3,.008),black); speaker.position.y=.725; hardware.add(speaker);
  const lens = new Mesh(new CircleGeometry(.014,32),metal); lens.position.set(.11,.725,.003); hardware.add(lens);
  const home = new Mesh(new PlaneGeometry(.17,.006),white); home.position.y=-.722; hardware.add(home);
  const captureCamera = new PerspectiveCamera();
  let visible=false, lastAspect=0, screenExposure=1;
  return {
    update(q: number, aspect: number, reduced: boolean, capture: (camera: PerspectiveCamera, target: WebGLRenderTarget) => void) {
      const state=phoneAt(q,reduced); visible=state.visible; if(!visible) return;
      if(aspect!==lastAspect){
        lastAspect=aspect;
        const width=Math.min(1440,Math.round(renderer.getSize(new Vector2()).x)); target.setSize(width,Math.round(width/aspect));
      }
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
      metal.dispose(); black.dispose(); white.dispose(); material.dispose();
    },
  };
}
