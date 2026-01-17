import * as THREE from 'three';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let camera, scene, renderer, model, reticle, hitTestSource = null, hitTestSourceRequested = false;
let controls, isARMode = false;

// inicializar cena
scene = new THREE.Scene();
scene.background = new THREE.Color(0xe0e0e0); // fundo claro estilo Sketchfab

// câmera
camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.01, 20);
camera.position.set(0, 1, 2); // posicionar câmera para visualização normal

// renderer
renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
document.body.appendChild(renderer.domElement);

// controles de órbita para modo normal (não AR)
controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 0.5;
controls.maxDistance = 10;

// Sistema de iluminação estilo Sketchfab

// Luz ambiente forte
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);

// Luz hemisférica para simular ambiente natural
const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xbbbbbb, 2.0);
hemisphereLight.position.set(0, 50, 0);
scene.add(hemisphereLight);

// Luz direcional principal (key light)
const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
keyLight.position.set(5, 10, 7);
keyLight.castShadow = true;
keyLight.shadow.mapSize.width = 2048;
keyLight.shadow.mapSize.height = 2048;
scene.add(keyLight);

// Luz de preenchimento (fill light)
const fillLight = new THREE.DirectionalLight(0xffffff, 1.5);
fillLight.position.set(-5, 5, -5);
scene.add(fillLight);

// Luz traseira (back light) para contorno
const backLight = new THREE.DirectionalLight(0xffffff, 1.0);
backLight.position.set(0, 5, -10);
scene.add(backLight);

// Luzes pontuais adicionais para destaque
const pointLight1 = new THREE.PointLight(0xffffff, 1.5, 50);
pointLight1.position.set(10, 10, 10);
scene.add(pointLight1);

const pointLight2 = new THREE.PointLight(0xffffff, 1.5, 50);
pointLight2.position.set(-10, 10, -10);
scene.add(pointLight2);

// adicionar um plano para receber sombras (modo normal)
const planeGeometry = new THREE.PlaneGeometry(4, 4);
const planeMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
plane.receiveShadow = true;
scene.add(plane);

// criar botão AR customizado
const arButton = ARButton.createButton(renderer, { 
  requiredFeatures: ['hit-test'],
  optionalFeatures: ['dom-overlay'],
  domOverlay: { root: document.body }
});
document.body.appendChild(arButton);

// adicionar texto de informação
const infoDiv = document.getElementById('info');
infoDiv.innerHTML = 'Carregando modelo...';

// load model .glb - COMENTADO PARA TESTE COM CUBO
const loader = new GLTFLoader();

// CRIAR CUBO DIRETAMENTE PARA TESTE
console.log('Criando cubo de teste...');
const geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
const material = new THREE.MeshStandardMaterial({ 
  color: 0xff4444, // vermelho
  metalness: 0.1,
  roughness: 0.4 
});
model = new THREE.Mesh(geometry, material);
model.position.set(0, 0.15, 0);
model.visible = true;
model.castShadow = true;
model.receiveShadow = true;
scene.add(model);
infoDiv.innerHTML = 'Cubo de teste carregado! Use o mouse para rotacionar. Clique em "Enter AR" para modo AR.';
console.log('Cubo de teste criado com sucesso!');

/* CÓDIGO ORIGINAL DO MODELO GLB - COMENTADO
loader.load('model.glb', 
  (gltf) => {
    model = gltf.scene;
    model.scale.set(0.5, 0.5, 0.5); // tamanho para visualização normal
    model.position.set(0, 0, 0);
    model.visible = true; // visível no modo normal
    
    // habilitar sombras no modelo
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        // garantir que o material seja visível
        if (child.material) {
          child.material.needsUpdate = true;
        }
      }
    });
    
    scene.add(model);
    infoDiv.innerHTML = 'Modelo carregado! Use o mouse para rotacionar. Clique em "Enter AR" para modo AR.';
    console.log('Modelo carregado com sucesso!');
  },
  (progress) => {
    const percent = Math.round((progress.loaded / progress.total * 100));
    infoDiv.innerHTML = `Carregando modelo... ${percent}%`;
    console.log('Carregando modelo...', percent + '%');
  },
  (error) => {
    console.error('Erro ao carregar modelo:', error);
    infoDiv.innerHTML = 'Erro ao carregar modelo. Usando cubo como exemplo.';
    
    // criar um cubo como fallback se o modelo não carregar
    const geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x00ff00,
      metalness: 0.3,
      roughness: 0.4 
    });
    model = new THREE.Mesh(geometry, material);
    model.position.set(0, 0.15, 0);
    model.visible = true;
    model.castShadow = true;
    model.receiveShadow = true;
    scene.add(model);
    console.log('Usando cubo como modelo de fallback');
  }
);
*/

// retículo (indicador de onde o modelo será colocado) - MAIS VISÍVEL
reticle = new THREE.Mesh(
  new THREE.RingGeometry(0.05, 0.08, 32).rotateX(-Math.PI/2),
  new THREE.MeshBasicMaterial({ 
    color: 0x00ff00, // verde para melhor visibilidade
    transparent: true, 
    opacity: 1.0,
    side: THREE.DoubleSide 
  })
);
reticle.matrixAutoUpdate = false;
reticle.visible = false;
scene.add(reticle);

// adicionar um ponto no centro do retículo
const centerDot = new THREE.Mesh(
  new THREE.CircleGeometry(0.02, 16).rotateX(-Math.PI/2),
  new THREE.MeshBasicMaterial({ 
    color: 0xff0000, // vermelho
    transparent: true, 
    opacity: 1.0 
  })
);
centerDot.position.set(0, 0.001, 0); // ligeiramente acima do retículo
reticle.add(centerDot);

// configurar eventos quando a sessão AR começar
renderer.xr.addEventListener('sessionstart', () => {
  console.log('🥽 Sessão AR iniciada!');
  isARMode = true;
  
  // esconder o fundo e o plano no modo AR
  scene.background = null;
  plane.visible = false;
  
  // ajustar escala do modelo para AR
  if (model) {
    model.scale.set(0.15, 0.15, 0.15); // menor para AR
    model.visible = false; // esconder até ser posicionado
    console.log('📦 Modelo ajustado para modo AR');
  }
  
  const session = renderer.xr.getSession();
  infoDiv.innerHTML = '🥽 Modo AR ativo! Mova o dispositivo para encontrar superfícies e toque para colocar cubos.';
  
  // evento de toque/clique
  session.addEventListener('select', (event) => {
    console.log('👆 TOQUE DETECTADO NO AR!');
    
    if (reticle.visible && model) {
      // criar uma cópia do modelo para colocar múltiplos objetos
      const newModel = model.clone();
      newModel.position.setFromMatrixPosition(reticle.matrix);
      newModel.quaternion.setFromRotationMatrix(reticle.matrix);
      newModel.visible = true;
      newModel.scale.set(0.15, 0.15, 0.15);
      
      // dar cor aleatória para diferenciar
      const randomColor = new THREE.Color().setHSL(Math.random(), 0.7, 0.5);
      newModel.material = newModel.material.clone();
      newModel.material.color = randomColor;
      
      scene.add(newModel);
      
      console.log('✅ Cubo colocado na posição:', newModel.position);
      infoDiv.innerHTML = `🎉 Cubo colocado! Total: ${scene.children.filter(child => child.isMesh && child !== model && child !== reticle && child !== plane).length} cubos`;
    } else {
      console.log('❌ Retículo não visível ou modelo não carregado');
      console.log('Retículo visível:', reticle.visible);
      console.log('Modelo existe:', !!model);
      infoDiv.innerHTML = '🔍 Mova o dispositivo lentamente para encontrar uma superfície plana.';
    }
  });
  
  // eventos adicionais para debug
  session.addEventListener('selectstart', () => {
    console.log('🟡 Select START');
  });
  
  session.addEventListener('selectend', () => {
    console.log('🔴 Select END');
  });
});

// evento quando sair do modo AR
renderer.xr.addEventListener('sessionend', () => {
  console.log('Sessão AR finalizada');
  isARMode = false;
  
  // restaurar fundo e plano
  scene.background = new THREE.Color(0xe0e0e0);
  plane.visible = true;
  
  // restaurar escala e visibilidade do modelo original
  if (model) {
    model.scale.set(0.5, 0.5, 0.5);
    model.position.set(0, 0, 0);
    model.visible = true;
  }
  
  infoDiv.innerHTML = 'Saiu do modo AR. Use o mouse para rotacionar o modelo.';
});

// render loop
renderer.setAnimationLoop((timestamp, frame) => {
  // atualizar controles apenas quando não estiver em AR
  if (!isARMode && controls) {
    controls.update();
  }
  
  // código específico para AR
  if (frame && isARMode) {
    const referenceSpace = renderer.xr.getReferenceSpace();
    const session = renderer.xr.getSession();

    if (!hitTestSourceRequested) {
      console.log('🎯 Solicitando hit test source...');
      session.requestReferenceSpace('viewer').then(refSpace => {
        session.requestHitTestSource({ space: refSpace }).then(source => {
          hitTestSource = source;
          console.log('✅ Hit test source configurado com sucesso!');
        }).catch(err => {
          console.error('❌ Erro ao configurar hit test source:', err);
        });
      }).catch(err => {
        console.error('❌ Erro ao obter reference space:', err);
      });
      hitTestSourceRequested = true;
    }

    if (hitTestSource) {
      try {
        const hitTestResults = frame.getHitTestResults(hitTestSource);
        
        if (hitTestResults.length > 0) {
          const hit = hitTestResults[0];
          const pose = hit.getPose(referenceSpace);

          if (pose) {
            if (!reticle.visible) {
              console.log('🎯 Superfície detectada! Retículo agora visível.');
              infoDiv.innerHTML = '🎯 Superfície encontrada! Toque na tela para colocar um cubo.';
            }
            reticle.visible = true;
            reticle.matrix.fromArray(pose.transform.matrix);
          }
        } else {
          if (reticle.visible) {
            console.log('🔍 Superfície perdida. Continue movendo o dispositivo.');
            infoDiv.innerHTML = '🔍 Continue movendo o dispositivo para encontrar uma superfície.';
          }
          reticle.visible = false;
        }
      } catch (error) {
        console.error('❌ Erro no hit test:', error);
      }
    } else {
      // feedback enquanto não tem hit test
      if (timestamp % 1000 < 16) { // a cada segundo aproximadamente
        console.log('⏳ Aguardando configuração do hit test...');
      }
    }
  }

  // animação simples para o modelo no modo normal
  if (!isARMode && model && model.visible) {
    model.rotation.y += 0.02; // rotação um pouco mais rápida
    model.rotation.x = Math.sin(timestamp * 0.001) * 0.1; // balançar levemente
  }

  renderer.render(scene, camera);
});

// adicionar tratamento de redimensionamento
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
