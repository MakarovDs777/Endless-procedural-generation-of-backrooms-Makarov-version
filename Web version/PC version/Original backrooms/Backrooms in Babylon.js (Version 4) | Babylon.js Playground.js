let existingChunks = {};
const CHUNK_SIZE = 100;
const LAMP_PROBABILITY = 0.5; // Вероятность генерации лампы (например, 50%)

// Создаем элементы для телепортации и отображения координат
const createUI = () => {
    // Контейнер для телепортации и координат
    const uiContainer = document.createElement('div');
    uiContainer.style.position = 'absolute';
    uiContainer.style.bottom = '0px';
    uiContainer.style.right = '210px';
    uiContainer.style.color = '#ffffff';
    uiContainer.style.display = 'flex'; // Используем флекс для выравнивания в ряд

    // Табло для координат
    const coordDisplay = document.createElement('div');
    coordDisplay.id = 'coordDisplay';
    coordDisplay.style.color = '#ffffff';
    uiContainer.appendChild(coordDisplay);

    const inputX = document.createElement('input');
    inputX.type = 'number';
    inputX.placeholder = 'X';
    inputX.style.margin = '5px';
    uiContainer.appendChild(inputX);

    const inputY = document.createElement('input');
    inputY.type = 'number';
    inputY.placeholder = 'Y';
    inputY.style.margin = '5px';
    uiContainer.appendChild(inputY);

    const inputZ = document.createElement('input');
    inputZ.type = 'number';
    inputZ.placeholder = 'Z';
    inputZ.style.margin = '5px';
    uiContainer.appendChild(inputZ);

    const teleportButton = document.createElement('button');
    teleportButton.textContent = 'Телепортироваться';
    teleportButton.style.margin = '5px';
    teleportButton.onclick = () => {
        const x = parseFloat(inputX.value);
        const y = parseFloat(inputY.value);
        const z = parseFloat(inputZ.value);
        teleportCamera(x, y, z);
    };
    uiContainer.appendChild(teleportButton);

    document.body.appendChild(uiContainer);
};


// Функция телепортации камеры
const teleportCamera = (x, y, z) => {
    camera.position = new BABYLON.Vector3(x, y, z);
    GenerateStructures(camera.position);
};

// Функция для создания сцены в Babylon.js
async function createScene() {
    const engine = new BABYLON.Engine(canvas);
    const scene = new BABYLON.Scene(engine);

    // Установка черного фона
    scene.clearColor = new BABYLON.Color4(0, 0, 0, 1); // RGBA

    camera = new BABYLON.FreeCamera("FreeCam", new BABYLON.Vector3(0, 10, -10), scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    camera.attachControl(canvas, true);

    const hemisphericLight = new BABYLON.HemisphericLight("Hemispheric Light", new BABYLON.Vector3(1, 1, 0), scene);
    hemisphericLight.intensity = 1;

    scene.registerBeforeRender(() => {
        updateCoordinatesDisplay(camera.position);
        GenerateStructures(camera.position);
        GenerateGroundChunks(camera.position);
    });

    engine.runRenderLoop(() => {
        if (scene && scene.activeCamera) {
            scene.render();
        }
    });

    return scene;
}

// Функция для отображения координат камеры
const updateCoordinatesDisplay = (position) => {
    const coordDisplay = document.getElementById('coordDisplay');
    coordDisplay.textContent = `Координаты: X: ${position.x.toFixed(2)}, Y: ${position.y.toFixed(2)}, Z: ${position.z.toFixed(2)}`;
};

function GenerateStructures(cameraPosition) {
    const chunkX = Math.floor(cameraPosition.x / CHUNK_SIZE);
    const chunkZ = Math.floor(cameraPosition.z / CHUNK_SIZE);

    for (let x = chunkX - 2; x <= chunkX + 2; x++) {
        for (let z = chunkZ - 2; z <= chunkZ + 2; z++) {
            const chunkId = `${x},${z}`;
            if (!existingChunks[chunkId]) {
                existingChunks[chunkId] = {
                    room: null,
                    corridors: []
                };
            }

            if (!existingChunks[chunkId].room) {
                const roomPosition = new BABYLON.Vector3(
                    x * CHUNK_SIZE + Math.random() * CHUNK_SIZE - CHUNK_SIZE / 2,
                    0,
                    z * CHUNK_SIZE + Math.random() * CHUNK_SIZE - CHUNK_SIZE / 2
                );

                if (Math.random() < 0.5) {
                    existingChunks[chunkId].room = CreateRoom(roomPosition);
                }
            }

            while (existingChunks[chunkId].corridors.length < 4) {
                if (Math.random() < 0.3) {
                    const corridorPosition = new BABYLON.Vector3(
                        x * CHUNK_SIZE + Math.random() * CHUNK_SIZE - CHUNK_SIZE / 2,
                        0,
                        z * CHUNK_SIZE + Math.random() * CHUNK_SIZE - CHUNK_SIZE / 2
                    );

                    const corridor = CreateCorridor(corridorPosition, Math.random() * Math.PI * 2);
                    existingChunks[chunkId].corridors.push(corridor);
                } else {
                    break;
                }
            }
        }
    }
}

function CreateRoom(position) {
    const roomSize = { width: 20, height: 22, depth: 5 };
    const roomMaterial = new BABYLON.StandardMaterial("roomMaterial", scene);
    
    const wallTexture = new BABYLON.Texture("https://i.postimg.cc/fTN3vyCh/wallpaper-new.jpg", scene);
    roomMaterial.diffuseTexture = wallTexture;
    
    const room = BABYLON.MeshBuilder.CreateBox("room", roomSize, scene);
    room.position = position;
    room.material = roomMaterial;

    AddStaticPhysics(room, 300);
    return room;
}

function CreateCorridor(position, rotation) {
    const corridorSize = { width: 25, height: 22, depth: 5 };
    const corridorMaterial = new BABYLON.StandardMaterial("corridorMaterial", scene);
    
    const wallTexture = new BABYLON.Texture("https://i.postimg.cc/fTN3vyCh/wallpaper-new.jpg", scene);
    corridorMaterial.diffuseTexture = wallTexture;
    
    const corridor = BABYLON.MeshBuilder.CreateBox("corridor", corridorSize, scene);
    corridor.position = position;
    corridor.rotation.y = rotation;
    corridor.material = corridorMaterial;

    AddStaticPhysics(corridor, 300);
    return corridor;
}

function GenerateGroundChunks(position) {
    const chunkX = Math.floor(position.x / CHUNK_SIZE);
    const chunkZ = Math.floor(position.z / CHUNK_SIZE);

    for (let x = chunkX - 2; x <= chunkX + 2; x++) {
        for (let z = chunkZ - 2; z <= chunkZ + 2; z++) {
            const chunkId = `${x},${z}`;
            if (!scene.getMeshByID(chunkId)) {
                const groundMaterial = new BABYLON.StandardMaterial(`GroundMaterial_${chunkId}`, scene);
                const groundTexture = new BABYLON.Texture("https://i.postimg.cc/wvStLGvz/image.jpg", scene);
                groundTexture.uScale = 5; 
                groundTexture.vScale = 5; 
                groundMaterial.diffuseTexture = groundTexture;
                groundMaterial.backFaceCulling = false;
                groundMaterial.specularColor = new BABYLON.Color3(0, 0, 0); // Отключение блеска

                const ground = BABYLON.MeshBuilder.CreateGround(chunkId, { width: CHUNK_SIZE, height: CHUNK_SIZE });
                ground.material = groundMaterial;
                ground.position.x = x * CHUNK_SIZE;
                ground.position.z = z * CHUNK_SIZE;
                ground.position.y = -11; 
                AddStaticPhysics(ground, 300);
            }
        }
    }

    for (let x = chunkX - 2; x <= chunkX + 2; x++) {
        for (let z = chunkZ - 2; z <= chunkZ + 2; z++) {
            const chunkId = `${x},${z}`;
            if (!scene.getMeshByID(`ceiling_${chunkId}`)) {
                const ceilingMaterial = new BABYLON.StandardMaterial(`CeilingMaterial_${chunkId}`, scene);
                const ceilingTexture = new BABYLON.Texture("https://i.postimg.cc/y83ChCs2/image.png", scene);
                ceilingTexture.uScale = 5; 
                ceilingTexture.vScale = 5; 
                ceilingMaterial.diffuseTexture = ceilingTexture;
                ceilingMaterial.backFaceCulling = false;

                const ceiling = BABYLON.MeshBuilder.CreateGround(`ceiling_${chunkId}`, { width: CHUNK_SIZE, height: CHUNK_SIZE });
                ceiling.material = ceilingMaterial;
                ceiling.position.x = x * CHUNK_SIZE;
                ceiling.position.z = z * CHUNK_SIZE;
                ceiling.position.y = 11; 
                AddStaticPhysics(ceiling, 300);

                // Создание ламп с учетом вероятности
                CreateLightsOnCeiling(ceiling.position);
            }
        }
    }
}

function CreateLightsOnCeiling(ceilingPosition) {
    const lightSize = { width: 5, height: 0.2, depth: 5 };
    const lampMaterial = new BABYLON.StandardMaterial("lampMaterial", scene);
    lampMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1); // Цвет свечения (например, белый)
    
    for (let offsetX = -CHUNK_SIZE / 2; offsetX <= CHUNK_SIZE / 2; offsetX += 20) {
        for (let offsetZ = -CHUNK_SIZE / 2; offsetZ <= CHUNK_SIZE / 2; offsetZ += 20) {
            if (Math.random() < LAMP_PROBABILITY) { // Условие для случайной генерации
                const lamp = BABYLON.MeshBuilder.CreateBox("lamp", lightSize, scene);
                lamp.material = lampMaterial;
                lamp.position.x = ceilingPosition.x + offsetX;
                lamp.position.z = ceilingPosition.z + offsetZ;
                lamp.position.y = ceilingPosition.y + 0; // Немного ниже потолка
            }
        }
    }
}

function AddStaticPhysics(mesh, friction) {
    mesh.physicsImpostor = new BABYLON.PhysicsImpostor(mesh,
        BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: friction }, scene);
}

// Создание интерфейса
createUI();

// Инициализация сцены
createScene();
