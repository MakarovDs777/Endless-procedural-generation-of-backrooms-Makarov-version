let existingChunks = {};
const CHUNK_SIZE = 100;

async function createScene() {
    const engine = new BABYLON.Engine(canvas);
    const scene = new BABYLON.Scene(engine);

    const camera = new BABYLON.FreeCamera("FreeCam", new BABYLON.Vector3(0, 10, -10), scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    camera.attachControl(canvas, true);

    const hemisphericLight = new BABYLON.HemisphericLight("Hemispheric Light", new BABYLON.Vector3(1, 1, 0), scene);
    hemisphericLight.intensity = 0.7;

    scene.registerBeforeRender(() => {
        GenerateRandomXYZWalls(camera.position);
    });

    engine.runRenderLoop(() => {
        if (scene && scene.activeCamera) {
            scene.render();
        }
    });

    return scene;
}

// Генерация случайных стен по всему пространству в XYZ
function GenerateRandomXYZWalls(cameraPosition) {
    const minX = Math.floor(cameraPosition.x / CHUNK_SIZE) - 2;
    const maxX = Math.floor(cameraPosition.x / CHUNK_SIZE) + 2;
    const minZ = Math.floor(cameraPosition.z / CHUNK_SIZE) - 2;
    const maxZ = Math.floor(cameraPosition.z / CHUNK_SIZE) + 2;

    for (let x = minX; x <= maxX; x++) {
        for (let z = minZ; z <= maxZ; z++) {
            const chunkId = `${x},${z}`;
            if (!existingChunks[chunkId]) {
                existingChunks[chunkId] = {
                    walls: []
                };
                CreateRandomXYZWallsForChunk(x, z, scene, existingChunks[chunkId]);
            }
        }
    }
}

// Создаёт случайное число стен (от 10 до 30) в чанке с случайными позициями, размерами и ориентациями
function CreateRandomXYZWallsForChunk(chunkX, chunkZ, scene, chunkData) {
    const wallCount = Math.floor(Math.random() * 21) + 10; // от 10 до 30
    const wallMaterial = new BABYLON.StandardMaterial("wallMaterial", scene);
    wallMaterial.diffuseTexture = new BABYLON.Texture("https://i.postimg.cc/fTN3vyCh/wallpaper-new.jpg", scene);

    for (let i = 0; i < wallCount; i++) {
        // случайная позиция внутри чанка
        const posX = (chunkX * CHUNK_SIZE) + Math.random() * CHUNK_SIZE;
        const posY = Math.random() * 50; // высота от 0 до 50 метров
        const posZ = (chunkZ * CHUNK_SIZE) + Math.random() * CHUNK_SIZE;

        // случайный размер (диаметр)
        const diameter = 1 + Math.random() * 49; // от 1 до 50 метров

        // случайная ориентация по всем осям
        const rotX = Math.random() * Math.PI * 2;
        const rotY = Math.random() * Math.PI * 2;
        const rotZ = Math.random() * Math.PI * 2;

        // создаём цилиндр или сферу для стены
        const wall = BABYLON.MeshBuilder.CreateCylinder(`wall_${chunkX}_${chunkZ}_${i}`, {
            diameter: diameter,
            height: 2, // высота стены
            tessellation: 16
        }, scene);

        wall.position = new BABYLON.Vector3(posX, posY, posZ);
        wall.rotation.x = rotX;
        wall.rotation.y = rotY;
        wall.rotation.z = rotZ;

        wall.material = wallMaterial;

        AddStaticPhysics(wall, 0.5);
        chunkData.walls.push(wall);
    }
}

// Создаёт комнату (оставляем без изменений)
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

// Создаёт коридор (оставляем без изменений)
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

// Генерация земли (опционально, можно убрать)
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

                const ground = BABYLON.MeshBuilder.CreateGround(chunkId, { width: CHUNK_SIZE, height: CHUNK_SIZE });
                ground.material = groundMaterial;
                ground.position.x = x * CHUNK_SIZE;
                ground.position.z = z * CHUNK_SIZE;
                ground.position.y = -10;
                AddStaticPhysics(ground, 300);
            }
        }
    }
}

function AddStaticPhysics(mesh, friction) {
    mesh.physicsImpostor = new BABYLON.PhysicsImpostor(mesh,
        BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: friction }, scene);
}

// Инициализация сцены
createScene();
