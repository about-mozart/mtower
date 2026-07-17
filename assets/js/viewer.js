import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const stage=document.querySelector('[data-model-stage]');
if(stage){
 try {
  const probe=document.createElement('canvas');
  if(!(probe.getContext('webgl2')||probe.getContext('webgl'))) throw new Error('WebGL indisponível');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cinemaMode=stage.classList.contains('cinema-model-stage');
  const mobile=innerWidth<760||navigator.connection?.saveData;
  const url=mobile?'assets/models/mtower-equipment-mobile.glb':'assets/models/mtower-equipment-mid.glb';
  const renderer=new THREE.WebGLRenderer({antialias:!mobile,alpha:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.25:1.7));renderer.setSize(stage.clientWidth,stage.clientHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;renderer.shadowMap.enabled=false;
  renderer.domElement.setAttribute('aria-label','Modelo 3D interativo de equipamento MTower. Arraste para girar.');renderer.domElement.tabIndex=0;stage.prepend(renderer.domElement);
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(cinemaMode?29:31,stage.clientWidth/stage.clientHeight,.1,1000);camera.position.set(cinemaMode?8.4:8,cinemaMode?4.2:4.5,cinemaMode?10.4:11);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enablePan=false;controls.enableZoom=false;controls.enableDamping=true;controls.dampingFactor=.06;controls.minPolarAngle=Math.PI*.28;controls.maxPolarAngle=Math.PI*.68;controls.target.set(0,.3,0);controls.autoRotate=!reduced;controls.autoRotateSpeed=.45;
  controls.addEventListener('start',()=>controls.autoRotate=false);
  scene.add(new THREE.HemisphereLight(0xdcecff,0x17191c,2.1));
  const key=new THREE.DirectionalLight(0xffffff,4.5);key.position.set(6,10,8);scene.add(key);
  const rim=new THREE.DirectionalLight(0xffc72c,4);rim.position.set(-8,5,-5);scene.add(rim);
  const fill=new THREE.PointLight(0x9dd8f7,6,30);fill.position.set(0,2,6);scene.add(fill);
  const grid=new THREE.GridHelper(30,30,0x4c535a,0x252a30);grid.position.y=-2.45;grid.material.opacity=.24;grid.material.transparent=true;scene.add(grid);
  const loader=new GLTFLoader();loader.setMeshoptDecoder(MeshoptDecoder);
  let model,visible=true;
  loader.load(url,gltf=>{
    model=gltf.scene;const box=new THREE.Box3().setFromObject(model);const size=box.getSize(new THREE.Vector3());const center=box.getCenter(new THREE.Vector3());model.position.sub(center);const max=Math.max(size.x,size.y,size.z);const scale=(cinemaMode?7.15:6.4)/max;model.scale.setScalar(scale);model.rotation.y=-.6;model.position.y=cinemaMode?-.35:-.2;model.position.x=cinemaMode?.45:0;
    model.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.side=THREE.DoubleSide;o.material.metalness=Math.max(o.material.metalness??0,.25);o.material.roughness=Math.min(o.material.roughness??.65,.68);if(!reduced)o.material.wireframe=true}});
    scene.add(model);stage.classList.add('is-loaded');document.documentElement.classList.add('model-ready');
    if(!reduced)setTimeout(()=>model.traverse(o=>{if(o.isMesh)o.material.wireframe=false}),1100);
  },undefined,err=>{console.error(err);stage.classList.add('is-error');});
  const observer=new IntersectionObserver(es=>visible=es[0].isIntersecting,{threshold:.02});observer.observe(stage);
  let last=performance.now();function animate(now){requestAnimationFrame(animate);if(!visible)return;const dt=Math.min((now-last)/1000,.04);last=now;if(model&&!controls.autoRotate&&!reduced)model.rotation.y+=Math.sin(now*.00025)*dt*.015;controls.update();renderer.render(scene,camera)}requestAnimationFrame(animate);
  const resize=()=>{const w=stage.clientWidth,h=stage.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false)};new ResizeObserver(resize).observe(stage);
  renderer.domElement.addEventListener('keydown',e=>{if(!model)return;if(e.key==='ArrowLeft')model.rotation.y-=.1;if(e.key==='ArrowRight')model.rotation.y+=.1});
 } catch (error) {
   console.warn('Fallback 3D ativado:', error);
   stage.classList.add('is-error');
 }
}
