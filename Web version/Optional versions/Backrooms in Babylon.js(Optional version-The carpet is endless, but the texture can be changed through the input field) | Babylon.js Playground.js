// Self-contained JS: создаёт canvas и UI динамически, затем запускает Babylon сцену.

// Глобальные переменные
let scene = null;
let engine = null;
const CHUNK_SIZE = 100;
const VISIBLE_RADIUS = 2;
let existingChunks = {}; // { "x,z": { groundMesh, material, texture } }
let textureUrl = "https://i.postimg.cc/wvStLGvz/image.jpg"; // дефолт

// --- Создаём canvas и UI динамически ---
function createUI() {
  // Canvas
  let canvas = document.getElementById("renderCanvas");
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.id = "renderCanvas";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    document.body.style.margin = "0";
    document.body.style.height = "100vh";
    document.body.appendChild(canvas);
  }

  // Контейнер UI
  const uiContainer = document.createElement("div");
  uiContainer.id = "uiContainer";
  uiContainer.style.position = "absolute";
  uiContainer.style.top = "600px";
  uiContainer.style.left = "920px";
  uiContainer.style.zIndex = "999";
  uiContainer.style.background = "rgba(255,255,255,0.9)";
  uiContainer.style.padding = "8px";
  uiContainer.style.borderRadius = "6px";
  uiContainer.style.fontFamily = "Arial, sans-serif";
  uiContainer.style.display = "flex";
  uiContainer.style.alignItems = "center";
  uiContainer.style.gap = "8px";

  // Поле ввода
  const input = document.createElement("input");
  input.type = "text";
  input.id = "textureUrl";
  input.value = textureUrl;
  input.style.width = "320px";

  // Кнопка
  const btn = document.createElement("button");
  btn.id = "applyBtn";
  btn.textContent = "Apply";

  // Предупреждение об ошибке загрузки (необязательно)
  const status = document.createElement("span");
  status.id = "textureStatus";
  status.style.fontSize = "12px";
  status.style.color = "#333";

  uiContainer.appendChild(document.createTextNode("Texture URL:"));
  uiContainer.appendChild(input);
  uiContainer.appendChild(btn);
  uiContainer.appendChild(status);
  document.body.appendChild(uiContainer);

  // Обработчик кнопки
  btn.addEventListener("click", () => {
    const newUrl = input.value.trim();
    if (!newUrl) {
      alert("Введите URL текстуры.");
      return;
    }
    textureUrl = newUrl;
    document.getElementById("textureStatus").textContent = "Applying...";
    updateExistingChunkTextures(newUrl).then(() => {
      document.getElementById("textureStatus").textContent = "Applied";
      setTimeout(() => { document.getElementById("textureStatus").textContent = ""; }, 2000);
    }).catch((e) => {
      document.getElementById("textureStatus").textContent = "Error";
      console.warn("Ошибка при обновлении текстур:", e);
    });
  });

  return canvas;
}

// --- Инициализация сцены и физики ---
async function createScene() {
  const canvas = createUI();
  engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
  scene = new BABYLON.Scene(engine);

  // Включаем физику (CannonJS)
  try {
    const gravityVector = new BABYLON.Vector3(0, -9.81, 0);
    const physicsPlugin = new BABYLON.CannonJSPlugin();
    scene.enablePhysics(gravityVector, physicsPlugin);
  } catch (e) {
    console.warn("Physics plugin init failed (проверьте подключение CannonJS):", e);
  }

  const camera = new BABYLON.FreeCamera("FreeCam", new BABYLON.Vector3(0, 10, -10), scene);
  camera.setTarget(BABYLON.Vector3.Zero());
  camera.attachControl(engine.getRenderingCanvas(), true);

  const hemisphericLight = new BABYLON.HemisphericLight("Hemi", new BABYLON.Vector3(1, 1, 0), scene);
  hemisphericLight.intensity = 0.7;

  scene.registerBeforeRender(() => {
    GenerateGroundChunks(camera.position);
  });

  engine.runRenderLoop(() => {
    if (scene && scene.activeCamera) {
      scene.render();
    }
  });

  window.addEventListener("resize", () => {
    engine.resize();
  });

  return scene;
}

// --- Генерация чанков ---
function GenerateGroundChunks(position) {
  if (!scene) return;
  const chunkX = Math.floor(position.x / CHUNK_SIZE);
  const chunkZ = Math.floor(position.z / CHUNK_SIZE);

  const needed = {};

  for (let x = chunkX - VISIBLE_RADIUS; x <= chunkX + VISIBLE_RADIUS; x++) {
    for (let z = chunkZ - VISIBLE_RADIUS; z <= chunkZ + VISIBLE_RADIUS; z++) {
      const chunkId = `${x},${z}`;
      needed[chunkId] = true;

      if (!existingChunks[chunkId]) {
        // Создаём материал и текстуру
        const groundMaterial = new BABYLON.StandardMaterial(`GroundMaterial_${chunkId}`, scene);
        const groundTexture = new BABYLON.Texture(textureUrl, scene, true, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE,
          () => { /* onLoad */ },
          (msg, exc) => { console.warn("Texture load error:", msg, exc); }
        );
        groundTexture.uScale = 5;
        groundTexture.vScale = 5;
        groundMaterial.diffuseTexture = groundTexture;

        const ground = BABYLON.MeshBuilder.CreateGround(chunkId, { width: CHUNK_SIZE, height: CHUNK_SIZE }, scene);
        ground.id = chunkId;
        ground.material = groundMaterial;
        ground.position.x = x * CHUNK_SIZE;
        ground.position.z = z * CHUNK_SIZE;
        ground.position.y = -10;

        AddStaticPhysics(ground, 300);

        existingChunks[chunkId] = { groundMesh: ground, material: groundMaterial, texture: groundTexture };
      }
    }
  }

  // Удаляем неиспользуемые чанки
  for (const id in existingChunks) {
    if (!needed[id]) {
      try {
        const obj = existingChunks[id];
        if (obj.texture) obj.texture.dispose();
        if (obj.material) obj.material.dispose();
        if (obj.groundMesh) {
          if (obj.groundMesh.physicsImpostor) {
            obj.groundMesh.physicsImpostor.dispose();
          }
          obj.groundMesh.dispose();
        }
      } catch (e) {
        console.warn("Error disposing chunk", id, e);
      }
      delete existingChunks[id];
    }
  }
}

// --- Обновление текстур у существующих чанков (возвращает Promise для UI статуса) ---
function updateExistingChunkTextures(newUrl) {
  return new Promise((resolve, reject) => {
    try {
      const promises = [];
      for (const id in existingChunks) {
        const obj = existingChunks[id];
        // Удаляем старую текстуру (если есть)
        try { if (obj.texture) obj.texture.dispose(); } catch (e) { /* ignore */ }

        // Создаём новую текстуру и ждём её загрузки
        const p = new Promise((res, rej) => {
          const newTex = new BABYLON.Texture(newUrl, scene, true, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE,
            () => { res(newTex); },
            (msg, exc) => { console.warn("Texture load error:", msg, exc); rej({msg, exc}); }
          );
          newTex.uScale = 5;
          newTex.vScale = 5;
        }).then((newTex) => {
          obj.material.diffuseTexture = newTex;
          obj.texture = newTex;
        });

        promises.push(p);
      }

      // Если нет существующих чанков — всё готово
      if (promises.length === 0) {
        resolve();
        return;
      }

      Promise.allSettled(promises).then((results) => {
        const rejected = results.filter(r => r.status === "rejected");
        if (rejected.length > 0) {
          console.warn("Некоторые текстуры не загрузились:", rejected);
          // всё равно считаем операцию завершённой, но предупреждаем
          resolve();
        } else {
          resolve();
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

// --- Физика для меша ---
function AddStaticPhysics(mesh, friction) {
  try {
    mesh.physicsImpostor = new BABYLON.PhysicsImpostor(mesh,
      BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: friction }, scene);
  } catch (e) {
    console.warn("AddStaticPhysics error (возможно физика не подключена):", e);
  }
}

// --- Запуск ---
createScene().catch(e => console.error("createScene error:", e));
