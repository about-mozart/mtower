import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const stage = document.querySelector('[data-model-stage]');

if (stage) {
  try {
    const probe = document.createElement('canvas');
    if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) {
      throw new Error('WebGL indisponível');
    }

    const decodePath = (value) => window.atob(value);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobile = window.innerWidth < 760 || Boolean(navigator.connection?.saveData);

    /*
      Os nomes dos arquivos são neutros e os caminhos não aparecem no HTML.
      Isso reduz a exposição casual, mas qualquer arquivo entregue ao navegador
      pode ser recuperado por uma pessoa com acesso às ferramentas de rede.
    */
    const modelLibrary = {
      campo: {
        desktop: decodePath('YXNzZXRzL21vZGVscy9hOTFmMDdjNC5nbGI='),
        mobile: decodePath('YXNzZXRzL21vZGVscy9hOTFmMDdjNC1tLmdsYg=='),
        size: 7.15,
        rotationY: -0.6,
        offsetX: 0.45,
        offsetY: -0.35
      },
      operacao: {
        desktop: decodePath('YXNzZXRzL21vZGVscy9mNGMyZDhhMS5nbGI='),
        mobile: decodePath('YXNzZXRzL21vZGVscy9mNGMyZDhhMS1tLmdsYg=='),
        size: 7.4,
        rotationY: -0.42,
        offsetX: 0.35,
        offsetY: -0.35
      }
    };

    const renderer = new THREE.WebGLRenderer({
      antialias: !mobile,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.25 : 1.7));
    renderer.setSize(stage.clientWidth, stage.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = false;
    renderer.domElement.setAttribute('aria-label', 'Modelo 3D interativo de equipamento MTower. Arraste para girar.');
    renderer.domElement.tabIndex = 0;
    renderer.domElement.addEventListener('contextmenu', (event) => event.preventDefault());
    renderer.domElement.addEventListener('dragstart', (event) => event.preventDefault());
    stage.prepend(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(29, stage.clientWidth / stage.clientHeight, 0.1, 1000);
    camera.position.set(8.4, 4.2, 10.4);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minPolarAngle = Math.PI * 0.28;
    controls.maxPolarAngle = Math.PI * 0.68;
    controls.target.set(0, 0.3, 0);
    controls.autoRotate = !reduced;
    controls.autoRotateSpeed = 0.45;
    controls.addEventListener('start', () => {
      controls.autoRotate = false;
    });

    scene.add(new THREE.HemisphereLight(0xdcecff, 0x17191c, 2.1));
    const keyLight = new THREE.DirectionalLight(0xffffff, 4.5);
    keyLight.position.set(6, 10, 8);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0xffc72c, 4);
    rimLight.position.set(-8, 5, -5);
    scene.add(rimLight);
    const fillLight = new THREE.PointLight(0x9dd8f7, 6, 30);
    fillLight.position.set(0, 2, 6);
    scene.add(fillLight);

    const grid = new THREE.GridHelper(30, 30, 0x4c535a, 0x252a30);
    grid.position.y = -2.45;
    grid.material.opacity = 0.24;
    grid.material.transparent = true;
    scene.add(grid);

    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);

    const cache = new Map();
    const pending = new Map();
    let currentModel = null;
    let currentKey = stage.dataset.modelKey || 'campo';
    let visible = true;
    let requestToken = 0;

    const prepareModel = (root, key) => {
      const config = modelLibrary[key];
      const box = new THREE.Box3().setFromObject(root);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      root.position.sub(center);
      const maximum = Math.max(size.x, size.y, size.z) || 1;
      root.scale.setScalar(config.size / maximum);
      root.rotation.y = config.rotationY;
      root.position.x += config.offsetX;
      root.position.y += config.offsetY;

      root.traverse((object) => {
        if (!object.isMesh) return;
        object.material = object.material.clone();
        object.material.side = THREE.DoubleSide;
        object.material.metalness = Math.max(object.material.metalness ?? 0, 0.22);
        object.material.roughness = Math.min(object.material.roughness ?? 0.65, 0.72);
        if (!reduced) object.material.wireframe = true;
      });
      root.userData.modelKey = key;
      return root;
    };

    const getModel = (key) => {
      if (!modelLibrary[key]) return Promise.reject(new Error(`Modelo não configurado: ${key}`));
      if (cache.has(key)) return Promise.resolve(cache.get(key));
      if (pending.has(key)) return pending.get(key);

      const config = modelLibrary[key];
      const url = mobile ? config.mobile : config.desktop;
      const promise = new Promise((resolve, reject) => {
        loader.load(
          url,
          (gltf) => {
            const root = prepareModel(gltf.scene, key);
            cache.set(key, root);
            pending.delete(key);
            resolve(root);
          },
          undefined,
          (error) => {
            pending.delete(key);
            reject(error);
          }
        );
      });
      pending.set(key, promise);
      return promise;
    };

    const revealSolid = (root) => {
      if (reduced) return;
      window.setTimeout(() => {
        root.traverse((object) => {
          if (object.isMesh) object.material.wireframe = false;
        });
      }, 850);
    };

    const setModel = async (key, options = {}) => {
      if (!modelLibrary[key]) return;
      const token = ++requestToken;
      const sameModel = currentModel && currentKey === key;
      currentKey = key;
      stage.dataset.modelKey = key;
      if (sameModel) return;

      stage.classList.add('is-switching');
      try {
        const next = await getModel(key);
        if (token !== requestToken) return;
        if (currentModel) scene.remove(currentModel);
        currentModel = next;
        scene.add(currentModel);
        stage.classList.add('is-loaded');
        stage.classList.remove('is-error');
        document.documentElement.classList.add('model-ready');
        revealSolid(currentModel);
        window.setTimeout(() => stage.classList.remove('is-switching'), options.instant ? 0 : 260);
      } catch (error) {
        console.error('Não foi possível carregar o modelo 3D:', error);
        stage.classList.remove('is-switching');
        if (!currentModel) stage.classList.add('is-error');
      }
    };

    window.mtowerModelViewer = {
      setModel,
      getCurrentModel: () => currentKey,
      hasModel: (key) => Boolean(modelLibrary[key])
    };

    document.addEventListener('mtower:model-change', (event) => {
      const key = event.detail?.key;
      if (key) setModel(key);
    });

    setModel(currentKey, { instant: true }).then(() => {
      const preload = () => getModel('operacao').catch(() => {});
      if ('requestIdleCallback' in window) window.requestIdleCallback(preload, { timeout: 3500 });
      else window.setTimeout(preload, 1800);
    });

    const observer = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
    }, { threshold: 0.02 });
    observer.observe(stage);

    let last = performance.now();
    const animate = (now) => {
      window.requestAnimationFrame(animate);
      if (!visible && !document.body.classList.contains('model-viewer-open')) return;
      const delta = Math.min((now - last) / 1000, 0.04);
      last = now;
      if (currentModel && !controls.autoRotate && !reduced) {
        currentModel.rotation.y += Math.sin(now * 0.00025) * delta * 0.015;
      }
      controls.update();
      renderer.render(scene, camera);
    };
    window.requestAnimationFrame(animate);

    const resize = () => {
      const width = Math.max(stage.clientWidth, 1);
      const height = Math.max(stage.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    new ResizeObserver(resize).observe(stage);

    renderer.domElement.addEventListener('keydown', (event) => {
      if (!currentModel) return;
      if (event.key === 'ArrowLeft') currentModel.rotation.y -= 0.1;
      if (event.key === 'ArrowRight') currentModel.rotation.y += 0.1;
    });
  } catch (error) {
    console.warn('Fallback 3D ativado:', error);
    stage.classList.add('is-error');
  }
}
