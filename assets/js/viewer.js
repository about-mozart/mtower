import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const stage = document.querySelector('[data-model-stage]');

if (stage) {
  try {
    const probe = document.createElement('canvas');
    if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) throw new Error('WebGL indisponível');

    const decodePath = (value) => window.atob(value);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobile = window.innerWidth < 760 || Boolean(navigator.connection?.saveData);

    const modelLibrary = {
      campo: {
        desktop: decodePath('YXNzZXRzL21vZGVscy9hOTFmMDdjNC5nbGI='),
        mobile: decodePath('YXNzZXRzL21vZGVscy9hOTFmMDdjNC1tLmdsYg=='),
        size: 7.15,
        rotationY: -0.6,
        offsetX: 0.35,
        offsetY: -0.2,
        camera: [1.05, 0.58, 1.35]
      },
      operacao: {
        desktop: decodePath('YXNzZXRzL21vZGVscy9mNGMyZDhhMS5nbGI='),
        mobile: decodePath('YXNzZXRzL21vZGVscy9mNGMyZDhhMS5nbGI='),
        size: 8.2,
        rotationY: -0.35,
        offsetX: 0.2,
        offsetY: 0,
        camera: [1.15, 0.5, 1.45]
      }
    };

    const renderer = new THREE.WebGLRenderer({
      antialias: !mobile,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.15 : 1.6));
    renderer.setSize(stage.clientWidth, stage.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = false;
    renderer.domElement.setAttribute('aria-label', 'Modelo 3D interativo de equipamento MTower. Arraste para girar.');
    renderer.domElement.tabIndex = 0;
    renderer.domElement.addEventListener('contextmenu', (event) => event.preventDefault());
    renderer.domElement.addEventListener('dragstart', (event) => event.preventDefault());
    stage.prepend(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(31, stage.clientWidth / stage.clientHeight, 0.01, 2000);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.065;
    controls.minPolarAngle = Math.PI * 0.2;
    controls.maxPolarAngle = Math.PI * 0.76;
    controls.autoRotate = !reduced;
    controls.autoRotateSpeed = 0.35;
    controls.addEventListener('start', () => { controls.autoRotate = false; });

    scene.add(new THREE.HemisphereLight(0xe7f0f7, 0x17191c, 2.25));
    const keyLight = new THREE.DirectionalLight(0xffffff, 4.2);
    keyLight.position.set(7, 11, 8);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0xffc72c, 2.25);
    rimLight.position.set(-8, 5, -6);
    scene.add(rimLight);
    const fillLight = new THREE.PointLight(0x9dd8f7, 3.5, 45);
    fillLight.position.set(1, 3, 8);
    scene.add(fillLight);

    const grid = new THREE.GridHelper(40, 40, 0x4c535a, 0x252a30);
    grid.material.opacity = 0.2;
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

    const prepareModel = (source, key) => {
      const config = modelLibrary[key];
      source.updateMatrixWorld(true);
      const sourceBox = new THREE.Box3().setFromObject(source);
      const sourceSize = sourceBox.getSize(new THREE.Vector3());
      const sourceCenter = sourceBox.getCenter(new THREE.Vector3());
      const maximum = Math.max(sourceSize.x, sourceSize.y, sourceSize.z) || 1;

      /*
        O modelo fica dentro de um grupo. Assim, centralização e escala são
        aplicadas sem alterar a hierarquia interna da montagem CAD.
      */
      source.position.sub(sourceCenter);
      const wrapper = new THREE.Group();
      wrapper.add(source);
      wrapper.scale.setScalar(config.size / maximum);
      wrapper.rotation.y = config.rotationY;
      wrapper.position.set(config.offsetX, config.offsetY, 0);

      source.traverse((object) => {
        if (!object.isMesh) return;
        if (Array.isArray(object.material)) {
          object.material = object.material.map((material) => {
            const clone = material.clone();
            clone.side = THREE.DoubleSide;
            return clone;
          });
        } else if (object.material) {
          object.material = object.material.clone();
          object.material.side = THREE.DoubleSide;
        }
        object.frustumCulled = true;
      });

      wrapper.userData.modelKey = key;
      wrapper.updateMatrixWorld(true);
      return wrapper;
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
            const model = prepareModel(gltf.scene, key);
            cache.set(key, model);
            pending.delete(key);
            resolve(model);
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

    const fitView = (expanded = document.body.classList.contains('model-viewer-open')) => {
      if (!currentModel) return;
      currentModel.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(currentModel);
      const sphere = box.getBoundingSphere(new THREE.Sphere());
      if (!Number.isFinite(sphere.radius) || sphere.radius <= 0) return;

      const config = modelLibrary[currentKey];
      const direction = new THREE.Vector3(...config.camera).normalize();
      const verticalFov = THREE.MathUtils.degToRad(camera.fov);
      const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * Math.max(camera.aspect, 0.01));
      const limitingFov = Math.min(verticalFov, horizontalFov);
      const padding = expanded ? 1.12 : (mobile ? 1.38 : 1.24);
      const distance = (sphere.radius / Math.sin(limitingFov / 2)) * padding;

      controls.target.copy(sphere.center);
      camera.position.copy(sphere.center).add(direction.multiplyScalar(distance));
      camera.near = Math.max(distance / 250, 0.01);
      camera.far = Math.max(distance * 30, 500);
      camera.updateProjectionMatrix();
      controls.update();

      grid.position.y = box.min.y - Math.max(sphere.radius * 0.035, 0.08);
    };

    const setModel = async (key, options = {}) => {
      if (!modelLibrary[key]) return;
      const token = ++requestToken;
      const sameModel = currentModel && currentKey === key;
      currentKey = key;
      stage.dataset.modelKey = key;
      if (sameModel) {
        fitView();
        return;
      }

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
        fitView();
        window.setTimeout(() => stage.classList.remove('is-switching'), options.instant ? 0 : 220);
      } catch (error) {
        console.error('Não foi possível carregar o modelo 3D:', error);
        stage.classList.remove('is-switching');
        if (!currentModel) stage.classList.add('is-error');
      }
    };

    window.mtowerModelViewer = {
      setModel,
      fitView,
      getCurrentModel: () => currentKey,
      hasModel: (key) => Boolean(modelLibrary[key])
    };

    document.addEventListener('mtower:model-change', (event) => {
      const key = event.detail?.key;
      if (key) setModel(key);
    });
    document.addEventListener('mtower:model-expanded', (event) => {
      window.setTimeout(() => fitView(Boolean(event.detail?.expanded)), 80);
    });

    setModel(currentKey, { instant: true });

    const observer = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
    }, { threshold: 0.02 });
    observer.observe(stage);

    let last = performance.now();
    const animate = (now) => {
      window.requestAnimationFrame(animate);
      if (!visible && !document.body.classList.contains('model-viewer-open')) return;
      last = now;
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
