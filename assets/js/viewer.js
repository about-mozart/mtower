import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { DRACOLoader } from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/DRACOLoader.js';

const stage = document.querySelector('[data-model-stage]');

if (stage) {
  try {

    /* =========================================================
       VERIFICA WEBGL
    ========================================================= */

    const probe = document.createElement('canvas');

    if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) {
      throw new Error('WebGL indisponível');
    }

    const mobile =
      window.innerWidth < 760 ||
      Boolean(navigator.connection?.saveData);

    const status =
      stage.querySelector('[data-model-status]');


    /* =========================================================
       BIBLIOTECA DE MODELOS
    ========================================================= */

    const modelLibrary = {

      campo: {
        desktop: 'assets/models/FAST_SITE.glb',
        mobile: 'assets/models/FAST_SITE.glb',
        label: 'Campo',
        rotation: [0, 0, 0],
        cameraDirection: [1.05, 0.58, 1.35],
        padding: 1.10,
        expandedPadding: 1.02
      },

      tecnologia: {
        desktop: 'assets/models/TORRE_REPETIDORA_DE_SINAL.glb',
        mobile: 'assets/models/TORRE_REPETIDORA_DE_SINAL.glb',
        label: 'Tecnologia',
        rotation: [0, 0, 0],
        cameraDirection: [1.05, 0.58, 1.35],
        padding: 1.10,
        expandedPadding: 1.02
      },

      engenharia: {
        desktop: 'assets/models/MASTER.glb',
        mobile: 'assets/models/MASTER.glb',
        label: 'Engenharia',
        rotation: [0, 0, 0],
        cameraDirection: [1.05, 0.58, 1.35],
        padding: 1.10,
        expandedPadding: 1.02
      },

      operacao: {
        desktop: 'assets/models/SHELTER_MULTIFUNCAO.glb',
        mobile: 'assets/models/SHELTER_MULTIFUNCAO.glb',
        label: 'Operação',
        rotation: [0, 0, 0],
        cameraDirection: [1.05, 0.58, 1.35],
        padding: 1.10,
        expandedPadding: 1.02
      },

      seguranca: {
        desktop: 'assets/models/SHELTER_BANHEIRO.glb',
        mobile: 'assets/models/SHELTER_BANHEIRO.glb',
        label: 'Segurança Operacional',
        rotation: [0, 0, 0],
        cameraDirection: [1.05, 0.58, 1.35],
        padding: 1.10,
        expandedPadding: 1.02
      }

    };


    /* =========================================================
       RENDERER
    ========================================================= */

    const renderer = new THREE.WebGLRenderer({
      antialias: !mobile,
      alpha: true,
      powerPreference: 'high-performance'
    });

    renderer.setPixelRatio(
      Math.min(
        window.devicePixelRatio,
        mobile ? 1.15 : 1.6
      )
    );

    renderer.setSize(
      Math.max(stage.clientWidth, 1),
      Math.max(stage.clientHeight, 1)
    );

    renderer.outputColorSpace =
      THREE.SRGBColorSpace;

    renderer.toneMapping =
      THREE.ACESFilmicToneMapping;

    renderer.toneMappingExposure = 1.08;

    renderer.shadowMap.enabled = false;

    renderer.domElement.setAttribute(
      'aria-label',
      'Modelo 3D interativo de equipamento MTower. Arraste para girar.'
    );

    renderer.domElement.tabIndex = 0;

    renderer.domElement.addEventListener(
      'contextmenu',
      event => event.preventDefault()
    );

    renderer.domElement.addEventListener(
      'dragstart',
      event => event.preventDefault()
    );

    stage.prepend(renderer.domElement);


    /* =========================================================
       CENA E CÂMERA
    ========================================================= */

    const scene =
      new THREE.Scene();

    const camera =
      new THREE.PerspectiveCamera(
        31,
        Math.max(stage.clientWidth, 1) /
        Math.max(stage.clientHeight, 1),
        0.001,
        100000
      );

    camera.up.set(0, 1, 0);


    /* =========================================================
       CONTROLES
    ========================================================= */

    const controls =
      new OrbitControls(
        camera,
        renderer.domElement
      );

    controls.enablePan = false;

    /*
     * Deixei zoom habilitado.
     * Assim podemos inspecionar o equipamento
     * depois que ele abrir.
     */
    controls.enableZoom = true;

    controls.enableDamping = true;
    controls.dampingFactor = 0.065;

    controls.minDistance = 0.01;
    controls.maxDistance = 10000;

    controls.autoRotate = false;


    /* =========================================================
       ILUMINAÇÃO
    ========================================================= */

    const hemisphere =
      new THREE.HemisphereLight(
        0xe7f0f7,
        0x17191c,
        2.25
      );

    scene.add(hemisphere);


    const keyLight =
      new THREE.DirectionalLight(
        0xffffff,
        4.2
      );

    keyLight.position.set(
      7,
      11,
      8
    );

    scene.add(keyLight);


    const rimLight =
      new THREE.DirectionalLight(
        0xffc72c,
        2.25
      );

    rimLight.position.set(
      -8,
      5,
      -6
    );

    scene.add(rimLight);


    const fillLight =
      new THREE.PointLight(
        0x9dd8f7,
        3.5,
        100
      );

    fillLight.position.set(
      1,
      3,
      8
    );

    scene.add(fillLight);


    /* =========================================================
       GRID
    ========================================================= */

    const grid =
      new THREE.GridHelper(
        40,
        40,
        0x4c535a,
        0x252a30
      );

    grid.material.opacity = 0.20;
    grid.material.transparent = true;

    scene.add(grid);


    /* =========================================================
       GLTF / GLB LOADER
    ========================================================= */

    const loader =
      new GLTFLoader();


    /* Meshopt */

    loader.setMeshoptDecoder(
      MeshoptDecoder
    );


    /* Draco */

    const dracoLoader =
      new DRACOLoader();

    dracoLoader.setDecoderPath(
      'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/libs/draco/gltf/'
    );

    dracoLoader.setDecoderConfig({
      type: 'wasm'
    });

    dracoLoader.preload();

    loader.setDRACOLoader(
      dracoLoader
    );


    /* =========================================================
       ESTADO
    ========================================================= */

    const cache = new Map();
    const pending = new Map();

    let currentModel = null;

    let currentKey =
      stage.dataset.modelKey ||
      'campo';

    let visible = true;

    let requestToken = 0;

    let fitFrame = 0;


    /* =========================================================
       PREPARA O MODELO

       IMPORTANTE:

       NÃO alteramos mais:
       - posição das peças
       - posição do gltf.scene
       - escala individual
       - rotação individual
       - transformações dos nós

       A montagem original permanece exatamente
       como foi exportada no GLB.
    ========================================================= */

    const prepareModel =
      (gltf, key) => {

        const config =
          modelLibrary[key];

        const source =
          gltf.scene;

        /*
         * Não tocar nas transformações internas.
         */

        source.updateMatrixWorld(true);


        /*
         * Wrapper externo.
         *
         * O GLB inteiro vira UM objeto para
         * apresentação no site.
         */

        const wrapper =
          new THREE.Group();

        wrapper.add(source);

        wrapper.rotation.set(
          ...config.rotation
        );

        /*
         * Neste momento não alteramos
         * nenhuma posição da montagem.
         */

        wrapper.updateMatrixWorld(true);


        /* ===============================================
           CENTRALIZA SOMENTE O WRAPPER
        =============================================== */

        let box =
          new THREE.Box3().setFromObject(
            wrapper,
            true
          );

        if (!box.isEmpty()) {

          const center =
            box.getCenter(
              new THREE.Vector3()
            );

          /*
           * Move o CONJUNTO COMPLETO.
           *
           * Nenhuma peça interna é movida.
           */

          wrapper.position.sub(
            center
          );

        }

        wrapper.updateMatrixWorld(true);


        /*
         * Guarda referência.
         */

        wrapper.userData.modelKey =
          key;

        wrapper.userData.homeRotation =
          wrapper.rotation.clone();

        wrapper.userData.homePosition =
          wrapper.position.clone();


        /*
         * NÃO clonamos materiais.
         * NÃO alteramos meshes.
         * NÃO alteramos nós.
         *
         * Isso ajuda a preservar exatamente
         * a estrutura criada pelo Composer.
         */

        return wrapper;

      };


    /* =========================================================
       CARREGA MODELO
    ========================================================= */

    const getModel =
      key => {

        if (!modelLibrary[key]) {

          return Promise.reject(
            new Error(
              `Modelo não configurado: ${key}`
            )
          );

        }


        if (cache.has(key)) {

          return Promise.resolve(
            cache.get(key)
          );

        }


        if (pending.has(key)) {

          return pending.get(key);

        }


        const config =
          modelLibrary[key];


        const url =
          mobile
            ? config.mobile
            : config.desktop;


        if (status) {

          status.textContent =
            `Carregando ${config.label}...`;

        }


        stage.classList.remove(
          'is-error'
        );


        const promise =
          new Promise(
            (resolve, reject) => {

              loader.load(

                url,


                /* ===============================
                   SUCESSO
                =============================== */

                gltf => {

                  try {

                    const model =
                      prepareModel(
                        gltf,
                        key
                      );


                    cache.set(
                      key,
                      model
                    );


                    pending.delete(
                      key
                    );


                    if (status) {

                      status.textContent =
                        'Visualização 3D pronta.';

                    }


                    resolve(
                      model
                    );

                  } catch (error) {

                    pending.delete(
                      key
                    );

                    reject(
                      error
                    );

                  }

                },


                /* ===============================
                   PROGRESSO
                =============================== */

                xhr => {

                  if (!status) {
                    return;
                  }


                  if (
                    xhr.lengthComputable &&
                    xhr.total > 0
                  ) {

                    const percent =
                      Math.min(
                        100,
                        Math.round(
                          (
                            xhr.loaded /
                            xhr.total
                          ) * 100
                        )
                      );


                    status.textContent =
                      `Carregando ${config.label}: ${percent}%`;

                  } else {

                    const mb =
                      (
                        xhr.loaded /
                        1024 /
                        1024
                      ).toFixed(1);


                    status.textContent =
                      `Carregando ${config.label}: ${mb} MB`;

                  }

                },


                /* ===============================
                   ERRO
                =============================== */

                error => {

                  pending.delete(
                    key
                  );


                  const fileName =
                    url
                      .split('/')
                      .pop();


                  console.error(
                    'Erro ao carregar modelo 3D:',
                    {
                      modelo: key,
                      arquivo: fileName,
                      url,
                      error
                    }
                  );


                  if (status) {

                    status.textContent =
                      `Não foi possível abrir ${fileName}.`;

                  }


                  reject(
                    error
                  );

                }

              );

            }
          );


        pending.set(
          key,
          promise
        );


        return promise;

      };


    /* =========================================================
       ENQUADRAMENTO AUTOMÁTICO
    ========================================================= */

    const fitView =
      (
        expanded =
          document.body.classList.contains(
            'model-viewer-open'
          )
      ) => {

        if (!currentModel) {
          return;
        }


        currentModel.updateMatrixWorld(
          true
        );


        const box =
          new THREE.Box3().setFromObject(
            currentModel,
            true
          );


        if (box.isEmpty()) {
          return;
        }


        const size =
          box.getSize(
            new THREE.Vector3()
          );


        const center =
          box.getCenter(
            new THREE.Vector3()
          );


        const config =
          modelLibrary[
            currentKey
          ];


        /*
         * Maior dimensão REAL da montagem.
         */

        const maxDimension =
          Math.max(
            size.x,
            size.y,
            size.z
          );


        /*
         * Calcula a distância usando o FOV.
         */

        const verticalFov =
          THREE.MathUtils.degToRad(
            camera.fov
          );


        let distance =
          maxDimension /
          (
            2 *
            Math.tan(
              verticalFov / 2
            )
          );


        const padding =
          expanded
            ? config.expandedPadding
            : config.padding;


        distance *=
          padding * 1.15;


        const direction =
          new THREE.Vector3(
            ...config.cameraDirection
          ).normalize();


        controls.target.copy(
          center
        );


        camera.position
          .copy(
            center
          )
          .add(
            direction.multiplyScalar(
              Math.max(
                distance,
                0.1
              )
            )
          );


        /*
         * Near/Far calculados com base
         * no equipamento.
         */

        camera.near =
          Math.max(
            maxDimension /
            10000,
            0.001
          );


        camera.far =
          Math.max(
            distance * 100,
            maxDimension * 100,
            1000
          );


        camera.updateProjectionMatrix();


        /*
         * Limites do zoom.
         */

        controls.minDistance =
          Math.max(
            maxDimension * 0.02,
            0.01
          );


        controls.maxDistance =
          Math.max(
            maxDimension * 20,
            distance * 10
          );


        controls.update();


        /* ===============================================
           GRID ABAIXO DO EQUIPAMENTO
        =============================================== */

        grid.position.set(
          center.x,
          box.min.y -
          Math.max(
            size.y * 0.03,
            maxDimension * 0.005
          ),
          center.z
        );


        /*
         * Ajusta tamanho visual do grid.
         */

        const gridScale =
          Math.max(
            maxDimension / 20,
            0.1
          );


        grid.scale.setScalar(
          gridScale
        );

      };


    /* =========================================================
       REENQUADRAR
    ========================================================= */

    const queueFit =
      (
        expanded =
          document.body.classList.contains(
            'model-viewer-open'
          )
      ) => {

        cancelAnimationFrame(
          fitFrame
        );


        fitFrame =
          requestAnimationFrame(
            () => {

              fitView(
                expanded
              );

            }
          );

      };


    /* =========================================================
       DEFINE MODELO ATUAL
    ========================================================= */

    const setModel =
      async (
        key,
        options = {}
      ) => {

        if (!modelLibrary[key]) {
          return;
        }


        const token =
          ++requestToken;


        const sameModel =
          currentModel &&
          currentKey === key;


        currentKey =
          key;


        stage.dataset.modelKey =
          key;


        if (sameModel) {

          queueFit();

          return;

        }


        stage.classList.add(
          'is-switching'
        );


        try {

          const next =
            await getModel(
              key
            );


          if (
            token !== requestToken
          ) {
            return;
          }


          if (currentModel) {

            scene.remove(
              currentModel
            );

          }


          currentModel =
            next;


          scene.add(
            currentModel
          );


          currentModel.updateMatrixWorld(
            true
          );


          stage.classList.add(
            'is-loaded'
          );


          stage.classList.remove(
            'is-error'
          );


          document.documentElement
            .classList.add(
              'model-ready'
            );


          queueFit(
            true
          );


          /*
           * Como o painel abre através de
           * transição CSS, recalculamos algumas vezes.
           */

          [
            80,
            250,
            500,
            800
          ].forEach(
            delay => {

              setTimeout(
                () => {

                  fitView(
                    document.body.classList.contains(
                      'model-viewer-open'
                    )
                  );

                },
                delay
              );

            }
          );


          setTimeout(
            () => {

              stage.classList.remove(
                'is-switching'
              );

            },
            options.instant
              ? 0
              : 220
          );


        } catch (error) {

          console.error(
            'Não foi possível carregar o modelo 3D:',
            error
          );


          stage.classList.remove(
            'is-switching'
          );


          if (!currentModel) {

            stage.classList.add(
              'is-error'
            );

          }

        }

      };


    /* =========================================================
       API GLOBAL
    ========================================================= */

    window.mtowerModelViewer = {

      setModel,

      fitView,

      getCurrentModel:
        () => currentKey,

      hasModel:
        key =>
          Boolean(
            modelLibrary[key]
          )

    };


    /* =========================================================
       TROCA DE CAPÍTULO
    ========================================================= */

    document.addEventListener(
      'mtower:model-change',
      event => {

        const key =
          event.detail?.key;


        /*
         * Não baixa o GLB aqui.
         *
         * Apenas registra qual equipamento
         * deverá abrir quando clicar em Ampliar 3D.
         */

        if (
          key &&
          modelLibrary[key]
        ) {

          currentKey =
            key;

          stage.dataset.modelKey =
            key;

        }

      }
    );


    /* =========================================================
       ABRIR / FECHAR 3D
    ========================================================= */

    document.addEventListener(
      'mtower:model-expanded',
      event => {

        const expanded =
          Boolean(
            event.detail?.expanded
          );


        const requestedKey =
          event.detail?.key ||
          stage.dataset.modelKey ||
          currentKey;


        if (expanded) {

          setModel(
            requestedKey,
            {
              instant: true
            }
          );

        }


        [
          40,
          180,
          380,
          620
        ].forEach(
          delay => {

            setTimeout(
              () => {

                if (currentModel) {

                  fitView(
                    expanded
                  );

                }

              },
              delay
            );

          }
        );

      }
    );


    /* =========================================================
       OBSERVADOR DE VISIBILIDADE
    ========================================================= */

    const observer =
      new IntersectionObserver(
        entries => {

          visible =
            entries[0]
              .isIntersecting;

        },
        {
          threshold: 0.02
        }
      );


    observer.observe(
      stage
    );


    /* =========================================================
       LOOP DE RENDER
    ========================================================= */

    const animate =
      () => {

        requestAnimationFrame(
          animate
        );


        if (
          !visible &&
          !document.body.classList.contains(
            'model-viewer-open'
          )
        ) {
          return;
        }


        controls.update();


        renderer.render(
          scene,
          camera
        );

      };


    requestAnimationFrame(
      animate
    );


    /* =========================================================
       RESIZE
    ========================================================= */

    let resizeTimer = 0;


    const resize =
      () => {

        const width =
          Math.max(
            stage.clientWidth,
            1
          );


        const height =
          Math.max(
            stage.clientHeight,
            1
          );


        camera.aspect =
          width / height;


        camera.updateProjectionMatrix();


        renderer.setSize(
          width,
          height,
          false
        );


        clearTimeout(
          resizeTimer
        );


        resizeTimer =
          setTimeout(
            () => {

              if (currentModel) {

                fitView(
                  document.body.classList.contains(
                    'model-viewer-open'
                  )
                );

              }

            },
            100
          );

      };


    new ResizeObserver(
      resize
    ).observe(
      stage
    );


    /* =========================================================
       TECLADO
    ========================================================= */

    renderer.domElement.addEventListener(
      'keydown',
      event => {

        if (!currentModel) {
          return;
        }


        const center =
          controls.target;


        const axis =
          new THREE.Vector3(
            0,
            1,
            0
          );


        if (
          event.key ===
          'ArrowLeft'
        ) {

          camera.position
            .sub(center)
            .applyAxisAngle(
              axis,
              -0.08
            )
            .add(center);

        }


        if (
          event.key ===
          'ArrowRight'
        ) {

          camera.position
            .sub(center)
            .applyAxisAngle(
              axis,
              0.08
            )
            .add(center);

        }


        controls.update();

      }
    );


  } catch (error) {

    console.warn(
      'Fallback 3D ativado:',
      error
    );


    stage.classList.add(
      'is-error'
    );

  }
}