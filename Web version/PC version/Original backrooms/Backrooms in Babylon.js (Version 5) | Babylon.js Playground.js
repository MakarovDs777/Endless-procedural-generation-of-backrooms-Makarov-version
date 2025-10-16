let existingChunks = {};
const CHUNK_SIZE = 100;
const LAMP_PROBABILITY = 0.5;

const createUI = () => {
    const uiContainer = document.createElement('div');
    uiContainer.style.position = 'absolute';
    uiContainer.style.bottom = '0px';
    uiContainer.style.right = '210px';
    uiContainer.style.color = '#ffffff';
    uiContainer.style.display = 'flex';

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

const teleportCamera = (x, y, z) => {
    camera.position = new BABYLON.Vector3(x, y, z);
    GenerateStructures(camera.position);
};

async function createScene() {
    const engine = new BABYLON.Engine(canvas);
    const scene = new BABYLON.Scene(engine);

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

const updateCoordinatesDisplay = (position) => {
    const coordDisplay = document.getElementById('coordDisplay');
    coordDisplay.textContent = `Координаты: X: ${position.x.toFixed(2)}, Y: ${position.y.toFixed(2)}, Z: ${position.z.toFixed(2)}`;
};

function GenerateStructures(cameraPosition) {
    const chunkX = Math.floor(cameraPosition.x / CHUNK_SIZE);
    const chunkZ = Math.floor(cameraPosition.z / CHUNK_SIZE);

    for (let x = chunkX - 1; x <= chunkX + 1; x++) {
        for (let z = chunkZ - 1; z <= chunkZ + 1; z++) {
            const chunkId = `${x},${z}`;
            if (!existingChunks[chunkId]) {
                existingChunks[chunkId] = {
                    walls: []
                };
                GenerateMaze(chunkId, x, z); // Генерация лабиринта
            }
        }
    }
}

function GenerateMaze(chunkId, chunkX, chunkZ) {
    const mazeSize = 20;
    const maze = generate2DArray(mazeSize, mazeSize, 0);
    const textures = [
        "https://i.postimg.cc/Pq7xgZY0/wallpaper.jpg",
        "https://i.postimg.cc/fTN3vyCh/wallpaper-new.jpg"
    ];

    for (let i = 1; i < mazeSize - 1; i += 2) {
        for (let j = 1; j < mazeSize - 1; j += 2) {
            maze[i][j] = 1; // Добавляем стену
            const randomDirection = Math.floor(Math.random() * 4);

            if (randomDirection === 0 && j < mazeSize - 2) {
                maze[i][j + 1] = 1;
            } else if (randomDirection === 1 && i < mazeSize - 2) {
                maze[i + 1][j] = 1;
            } else if (randomDirection === 2 && j > 1) { // Влево
                maze[i][j - 1] = 1;
            } else if (randomDirection === 3 && i > 1) { // Вверх
                maze[i - 1][j] = 1;
            }
        }
    }

    // Увеличение расстояния между стенами
    const WALL_THICKNESS = 5; // Толщина стены 
    const SPACE_WIDTH = 10; // Пространство между стенами

    for (let i = 1; i < maze.length - 1; i++) {
        for (let j = 1; j < maze[i].length - 1; j++) {
            if (maze[i][j] === 1) { // Стена
                const wall = BABYLON.MeshBuilder.CreateBox("wall", {
                    height: 23,
                    width: WALL_THICKNESS,
                    depth: WALL_THICKNESS
                }, scene);
                
                wall.position.x = (chunkX * CHUNK_SIZE) + (j * (WALL_THICKNESS + SPACE_WIDTH)) - (CHUNK_SIZE / 2); // Центрируем по x
                wall.position.y = 0;
                wall.position.z = (chunkZ * CHUNK_SIZE) + (i * (WALL_THICKNESS + SPACE_WIDTH)) - (CHUNK_SIZE / 2); // Центрируем по z

                // Выбираем случайную текстуру
                const randomTextureIndex = Math.floor(Math.random() * textures.length);
                const wallMaterial = new BABYLON.StandardMaterial(`wallMaterial_${chunkId}_${i}_${j}`, scene);
                wallMaterial.diffuseTexture = new BABYLON.Texture(textures[randomTextureIndex], scene);
                wall.material = wallMaterial;

                existingChunks[chunkId].walls.push(wall);
            }
        }
    }
}

function generate2DArray(height, width, defaultValue) {
    const array = [];
    for (let i = 0; i < height; i++) {
        array[i] = [];
        for (let j = 0; j < width; j++) {
            array[i][j] = defaultValue;
        }
    }
    return array;
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
            if (Math.random() < LAMP_PROBABILITY) {
                const lamp = BABYLON.MeshBuilder.CreateBox("lamp", lightSize, scene);
                lamp.material = lampMaterial;
                lamp.position.x = ceilingPosition.x + offsetX;
                lamp.position.z = ceilingPosition.z + offsetZ;
                lamp.position.y = ceilingPosition.y + 0;
            }
        }
    }
}

function AddStaticPhysics(mesh, friction) {
    mesh.physicsImpostor = new BABYLON.PhysicsImpostor(mesh,
        BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: friction }, scene);
}

createUI();
createScene();
