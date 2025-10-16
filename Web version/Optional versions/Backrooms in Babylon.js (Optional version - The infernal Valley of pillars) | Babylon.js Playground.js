let existingChunks = {};
const CHUNK_SIZE = 100;

async function createScene() {
    const engine = new BABYLON.Engine(canvas);
    const scene = new BABYLON.Scene(engine);

    const camera = new BABYLON.FreeCamera("FreeCam", new BABYLON.Vector3(0, 10, -10), scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    camera.attachControl(canvas, true);

    const hemisphericLight = new BABYLON.HemisphericLight("Hemispheric Light", new BABYLON.Vector3(1, 1, 0), scene);
    hemisphericLight.intensity = 1;

    scene.registerBeforeRender(() => {
        GenerateStructures(camera.position);
        GenerateGroundChunks(camera.position);
    });

    engine.runRenderLoop(() => {
        scene.render();
    });

    return scene;
}

function GenerateStructures(cameraPosition) {
    const chunkX = Math.floor(cameraPosition.x / CHUNK_SIZE);
    const chunkZ = Math.floor(cameraPosition.z / CHUNK_SIZE);

    // Генерация чанков вокруг текущей позиции камеры с уникальными лабиринтами
    for (let x = chunkX - 1; x <= chunkX + 1; x++) {
        for (let z = chunkZ - 1; z <= chunkZ + 1; z++) {
            const chunkId = `${x},${z}`;
            if (!existingChunks[chunkId]) {
                existingChunks[chunkId] = {
                    walls: [],
                    corridors: []
                };
                GenerateMaze(chunkId, x, z);
            }
        }
    }
}

function GenerateMaze(chunkId, chunkX, chunkZ) {
    const mazeSize = CHUNK_SIZE / 5; // Размер лабиринта
    const maze = generate2DArray(mazeSize, mazeSize, 1);

    // Генерация лабиринта
    for (let i = 1; i < mazeSize - 1; i += 2) {
        for (let j = 1; j < mazeSize - 1; j += 2) {
            maze[i][j] = 0; // Открывем ячейку

            // Случайное направление
            if (Math.random() < 0.5) {
                maze[i][j + 1] = 0; // Проход вправо
            } else {
                maze[i + 1][j] = 0; // Проход вниз
            }
        }
    }

    // Создание 3D стен из лабиринта
    for (let i = 0; i < maze.length; i++) {
        for (let j = 0; j < maze[i].length; j++) {
            if (maze[i][j] === 1) {
                const wall = BABYLON.MeshBuilder.CreateBox("wall", {
                    height: 10,
                    width: 3,
                    depth: 3
                }, scene);
                wall.position.x = chunkX * CHUNK_SIZE + j * 5;
                wall.position.y = 0;
                wall.position.z = chunkZ * CHUNK_SIZE + i * 5;
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
                const ground = BABYLON.MeshBuilder.CreateGround(chunkId, { width: CHUNK_SIZE, height: CHUNK_SIZE });
                ground.position.x = x * CHUNK_SIZE;
                ground.position.z = z * CHUNK_SIZE;
                ground.position.y = -1; // Уровень земли
            }
        }
    }
}



// Создаем элементы для телепортации и отображения координат
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

const updateCoordinatesDisplay = (position) => {
    const coordDisplay = document.getElementById('coordDisplay');
    coordDisplay.textContent = `Координаты: X: ${position.x.toFixed(2)}, Y: ${position.y.toFixed(2)}, Z: ${position.z.toFixed(2)}`;
};

createUI();
createScene();
