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
        if (scene && scene.activeCamera) {
            scene.render();
        }
    });

    return scene;
}

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

                // Создание ламп
                CreateLightsOnCeiling(ceiling.position);
            }
        }
    }
}

function CreateLightsOnCeiling(ceilingPosition) {
    const lightSize = { width: 5, height: 0.2, depth: 5 };
    const lampMaterial = new BABYLON.StandardMaterial("lampMaterial", scene);
    lampMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1); // Цвет свечения (например, желтый)
    
    for (let offsetX = -CHUNK_SIZE / 2; offsetX <= CHUNK_SIZE / 2; offsetX += 20) {
        for (let offsetZ = -CHUNK_SIZE / 2; offsetZ <= CHUNK_SIZE / 2; offsetZ += 20) {
            const lamp = BABYLON.MeshBuilder.CreateBox("lamp", lightSize, scene);
            lamp.material = lampMaterial;
            lamp.position.x = ceilingPosition.x + offsetX;
            lamp.position.z = ceilingPosition.z + offsetZ;
            lamp.position.y = ceilingPosition.y + 0; // Немного ниже потолка
        }
    }
}


function AddStaticPhysics(mesh, friction) {
    mesh.physicsImpostor = new BABYLON.PhysicsImpostor(mesh,
        BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: friction }, scene);
}

// Инициализация сцены
createScene();


function AddStaticPhysics(mesh, friction) {
    mesh.physicsImpostor = new BABYLON.PhysicsImpostor(mesh,
        BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: friction }, scene);
}

// Инициализация сцены
createScene();
