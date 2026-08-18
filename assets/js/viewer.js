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

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobile = window.innerWidth < 760 || Boolean(navigator.connection?.saveData);
    const status = stage.querySelector('[data-model-status]');

    const modelLibrary = {
      campo: {
        desktop: 'assets/models/FAST_SITE.glb',
        mobile: 'assets/models/FAST_SITE.glb',
        label: 'Campo',
        size: 8,
        rotation: [0, 0, 0],
        offset: [0, 0, 0],
        cameraDirection: [1.05, 0.58, 1.35],
        padding: 1.12,
        expandedPadding: 1.04
      },
      tecnologia: {
        desktop: 'assets/models/TORRE_REPETIDORA_DE_SINAL.glb',
        mobile: 'assets/models/TORRE_REPETIDORA_DE_SINAL.glb',
        label: 'Tecnologia',
        size: 8,
        rotation: [0, 0, 0],
        offset: [0, 0, 0],
        cameraDirection: [1.05, 0.58, 1.35],
        padding: 1.12,
        expandedPadding: 1.04
      },
      engenharia: {
        desktop: 'assets/models/MASTER.glb',
        mobile: 'assets/models/MASTER.glb',
        label: 'Engenharia',
        size: 8,
        rotation: [0, 0, 0],
        offset: [0, 0, 0],
        cameraDirection: [1.05, 0.58, 1.35],
        padding: 1.12,
        expandedPadding: 1.04
      },
      operacao: {
        desktop: 'assets/models/SHELTER_MULTIFUNCAO.glb',
        mobile: 'assets/models/SHELTER_MULTIFUNCAO.glb',
        label: 'Operação',
        size: 8,
        rotation: [0, 0, 0],
        offset: [0, 0, 0],
        cameraDirection: [1.05, 0.58, 1.35],
        padding: 1.12,
        expandedPadding: 1.04
      },
      seguranca: {
        desktop: 'assets/models/SHELTER_BANHEIRO.glb',
        mobile: 'assets/models/SHELTER_BANHEIRO.glb',
        label: 'Segurança Operacional',
        size: 8,
        rotation: [0, 0, 0],
        offset: [0, 0, 0],
        cameraDirection: [1.05, 0.58, 1.35],
        padding: 1.12,
        expandedPadding: 1.04
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
    camera.up.set(0, 1, 0);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.065;
    controls.minPolarAngle = Math.PI * 0.16;
    controls.maxPolarAngle = Math.PI * 0.84;
    /* Mantém o enquadramento escolhido até que a pessoa interaja. */
    controls.autoRotate = false;

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
    let fitFrame = 0;

    const removeImportedCameras = (source) => {
      const cameras = [];
      source.traverse((object) => {
        if (object.isCamera) cameras.push(object);
      });
      cameras.forEach((object) => object.parent?.remove(object));
    };

    const prepareModel = (gltf, key) => {
      const config = modelLibrary[key];
      const source = gltf.scene;

      removeImportedCameras(source);
      source.updateMatrixWorld(true);

      const sourceBox = new THREE.Box3().setFromObject(source, true);
      const sourceSize = sourceBox.getSize(new THREE.Vector3());
      const sourceCenter = sourceBox.getCenter(new THREE.Vector3());
      const maximum = Math.max(sourceSize.x, sourceSize.y, sourceSize.z) || 1;

      /*
        A montagem permanece intacta. Somente o grupo externo recebe
        centralização, escala e orientação para apresentação no site.
      */
      source.position.sub(sourceCenter);

      const wrapper = new THREE.Group();
      wrapper.add(source);
      wrapper.scale.setScalar(config.size / maximum);
      wrapper.rotation.set(...config.rotation);
      wrapper.position.set(...config.offset);

      source.traverse((object) => {
        if (!object.isMesh && !object.isInstancedMesh) return;

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
      wrapper.userData.homeRotation = wrapper.rotation.clone();
      wrapper.userData.homePosition = wrapper.position.clone();
      wrapper.updateMatrixWorld(true);
      return wrapper;
    };

    const getModel = (key) => {
      if (!modelLibrary[key]) {
        return Promise.reject(new Error(`Modelo não configurado: ${key}`));
      }
      if (cache.has(key)) return Promise.resolve(cache.get(key));
      if (pending.has(key)) return pending.get(key);

      const config = modelLibrary[key];
      const url = mobile ? config.mobile : config.desktop;
      if (status) status.textContent = `Carregando ${config.label || 'modelo 3D'}...`;
      stage.classList.remove('is-error');
      const promise = new Promise((resolve, reject) => {
        loader.load(
          url,
          (gltf) => {
            const model = prepareModel(gltf, key);
            if (status) status.textContent = 'Visualização 3D pronta.';
            cache.set(key, model);
            pending.delete(key);
            resolve(model);
          },
          undefined,
          (error) => {
            pending.delete(key);
            if (status) {
              const fileName = url.split('/').pop();
              status.textContent = `Não foi possível abrir ${fileName}. Confirme se o arquivo está em assets/models.`;
            }
            reject(error);
          }
        );
      });

      pending.set(key, promise);
      return promise;
    };

    const getBoxCorners = (box) => {
      const { min, max } = box;
      return [
        new THREE.Vector3(min.x, min.y, min.z),
        new THREE.Vector3(min.x, min.y, max.z),
        new THREE.Vector3(min.x, max.y, min.z),
        new THREE.Vector3(min.x, max.y, max.z),
        new THREE.Vector3(max.x, min.y, min.z),
        new THREE.Vector3(max.x, min.y, max.z),
        new THREE.Vector3(max.x, max.y, min.z),
        new THREE.Vector3(max.x, max.y, max.z)
      ];
    };

    const fitView = (expanded = document.body.classList.contains('model-viewer-open')) => {
      if (!currentModel) return;

      currentModel.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(currentModel, true);
      if (box.isEmpty()) return;

      const center = box.getCenter(new THREE.Vector3());
      const config = modelLibrary[currentKey];
      const direction = new THREE.Vector3(...config.cameraDirection).normalize();
      const worldUp = new THREE.Vector3(0, 1, 0);
      const right = new THREE.Vector3().crossVectors(worldUp, direction);
      if (right.lengthSq() < 0.0001) right.set(1, 0, 0);
      right.normalize();
      const up = new THREE.Vector3().crossVectors(direction, right).normalize();

      let halfWidth = 0;
      let halfHeight = 0;
      let halfDepth = 0;
      getBoxCorners(box).forEach((corner) => {
        const relative = corner.sub(center);
        halfWidth = Math.max(halfWidth, Math.abs(relative.dot(right)));
        halfHeight = Math.max(halfHeight, Math.abs(relative.dot(up)));
        halfDepth = Math.max(halfDepth, Math.abs(relative.dot(direction)));
      });

      const verticalFov = THREE.MathUtils.degToRad(camera.fov);
      const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * Math.max(camera.aspect, 0.01));
      const padding = expanded ? config.expandedPadding : (mobile ? config.padding * 1.16 : config.padding);
      const distanceForHeight = halfHeight / Math.max(Math.tan(verticalFov / 2), 0.001);
      const distanceForWidth = halfWidth / Math.max(Math.tan(horizontalFov / 2), 0.001);
      const distance = Math.max(distanceForHeight, distanceForWidth) * padding + halfDepth * 1.05;

      camera.up.copy(up);
      controls.target.copy(center);
      camera.position.copy(center).add(direction.multiplyScalar(Math.max(distance, 0.5)));
      camera.near = Math.max(distance / 300, 0.01);
      camera.far = Math.max(distance * 25, 500);
      camera.updateProjectionMatrix();
      controls.update();

      grid.position.y = box.min.y - Math.max((box.max.y - box.min.y) * 0.045, 0.08);
      grid.rotation.set(0, 0, 0);
    };

    const queueFit = (expanded = document.body.classList.contains('model-viewer-open')) => {
      window.cancelAnimationFrame(fitFrame);
      fitFrame = window.requestAnimationFrame(() => fitView(expanded));
    };

    const setModel = async (key, options = {}) => {
      if (!modelLibrary[key]) return;

      const token = ++requestToken;
      const sameModel = currentModel && currentKey === key;
      currentKey = key;
      stage.dataset.modelKey = key;

      if (sameModel) {
        queueFit();
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

        queueFit();
        window.setTimeout(() => queueFit(), 120);
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
      const expanded = Boolean(event.detail?.expanded);
      const requestedKey = event.detail?.key || stage.dataset.modelKey || currentKey;

      if (expanded) {
        setModel(requestedKey, { instant: true });
      }

      /*
        A área muda de tamanho por transição CSS. Reenquadrar em etapas evita
        que o modelo seja calculado com a dimensão antiga e fique pequeno ou fora do centro.
      */
      [40, 180, 380, 620].forEach((delay) => {
        window.setTimeout(() => fitView(expanded), delay);
      });
    });

    /*
      A home não carrega nenhum GLB automaticamente. O download e a renderização
      acontecem apenas quando a pessoa clica em “Ampliar 3D”.
    */
    if (document.body.classList.contains('model-viewer-open')) {
      setModel(currentKey, { instant: true });
    }

    const observer = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
    }, { threshold: 0.02 });
    observer.observe(stage);

    const animate = () => {
      window.requestAnimationFrame(animate);
      if (!visible && !document.body.classList.contains('model-viewer-open')) return;
      controls.update();
      renderer.render(scene, camera);
    };
    window.requestAnimationFrame(animate);

    let resizeTimer = 0;
    const resize = () => {
      const width = Math.max(stage.clientWidth, 1);
      const height = Math.max(stage.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);

      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        if (currentModel) fitView();
      }, 80);
    };
    new ResizeObserver(resize).observe(stage);

    renderer.domElement.addEventListener('keydown', (event) => {
      if (!currentModel) return;
      if (event.key === 'ArrowLeft') camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), -0.08);
      if (event.key === 'ArrowRight') camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.08);
      controls.update();
    });
  } catch (error) {
    console.warn('Fallback 3D ativado:', error);
    stage.classList.add('is-error');
  }
}
