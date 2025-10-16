const createScene = function () {
    const scene = new BABYLON.Scene(engine);
    const camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 50, 0), scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    camera.attachControl(canvas, true);
    const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);

    const chunkSize = 6;
    const chunkStep = 7;
    const visibleChunksRadius = 1;
    const dropProbability = 0.82;
    const existingChunks = {};

    const createChunk = (chunkX, chunkZ) => {
        const chunkId = `${chunkX}_${chunkZ}`;
        if (existingChunks[chunkId]) {
            return;
        }

        const lines = [];

        // Function to create a wall segment using CreateBox (instead of CreateLines)
        const createWallSegment = (pointA, pointB) => {
            const wallHeight = 5; // Высота стены
                    const wallThickness = 0.2; // Толщина стены

            const direction = pointB.subtract(pointA);
            const distance = direction.length();
            const wallCenter = pointA.add(direction.scale(0.5));

            const wall = BABYLON.MeshBuilder.CreateBox("wall", {
                height: wallHeight,
                width: distance,
                depth: wallThickness
            }, scene);

            // Позиционируем и поворачиваем стену
            wall.position = wallCenter.add(new BABYLON.Vector3(0, wallHeight / 2, 0));
            wall.lookAt(pointB.add(new BABYLON.Vector3(0, wallHeight / 2, 0))); // Поворот по оси Y

            // Создаём материал и применяем текстуру        
            const wallMaterial = new BABYLON.StandardMaterial("wallMaterial", scene);
            const wallTexture = new BABYLON.Texture("https://i.postimg.cc/fTN3vyCh/wallpaper-new.jpg", scene);
            wallTexture.uScale = distance / 2; // Масштаб по горизонтали
            wallTexture.vScale = wallHeight / 2; // Масштаб по вертикали
            wallMaterial.diffuseTexture = wallTexture;

            wall.material = wallMaterial;

            return wall;
        };



        for (let z = 0; z <= chunkSize; z++) {
            for (let x = 0; x < chunkSize; x++) {
                if (Math.random() >= dropProbability) {
                    const pointA = new BABYLON.Vector3((chunkX * chunkSize + x) * chunkStep, 0, (chunkZ * chunkSize + z) * chunkStep);
                    const pointB = new BABYLON.Vector3((chunkX * chunkSize + x + 1) * chunkStep, 0, (chunkZ * chunkSize + z) * chunkStep);
                    const result = createWallSegment(pointA, pointB);
                    if (result) lines.push(result);
                }
            }
        }

        for (let x = 0; x <= chunkSize; x++) {
            for (let z = 0; z < chunkSize; z++) {
                if (Math.random() >= dropProbability) {
                    const pointA = new BABYLON.Vector3((chunkX * chunkSize + x) * chunkStep, 0, (chunkZ * chunkSize + z) * chunkStep);
                    const pointB = new BABYLON.Vector3((chunkX * chunkSize + x) * chunkStep, 0, (chunkZ * chunkSize + z + 1) * chunkStep);
                    const result = createWallSegment(pointA, pointB);
                    if (result) lines.push(result);
                }
            }
        }

        for (let z = 0; z < chunkSize; z++) {
            for (let x = 0; x < chunkSize; x++) {
                if (Math.random() >= dropProbability) {
                    const pointA = new BABYLON.Vector3((chunkX * chunkSize + x) * chunkStep, 0, (chunkZ * chunkSize + z) * chunkStep);
                    const pointB = new BABYLON.Vector3((chunkX * chunkSize + x + 1) * chunkStep, 0, (chunkZ * chunkSize + z + 1) * chunkStep);
                    const result = createWallSegment(pointA, pointB);
                    if (result) lines.push(result);
                }
            }
        }

        for (let z = 0; z < chunkSize; z++) {
            for (let x = 0; x < chunkSize; x++) {
                if (Math.random() >= dropProbability) {
                    const pointA = new BABYLON.Vector3((chunkX * chunkSize + x + 1) * chunkStep, 0, (chunkZ * chunkSize + z) * chunkStep);
                    const pointB = new BABYLON.Vector3((chunkX * chunkSize + x) * chunkStep, 0, (chunkZ * chunkSize + z + 1) * chunkStep);
                    const result = createWallSegment(pointA, pointB);
                    if (result) lines.push(result);
                }
            }
        }


        existingChunks[chunkId] = { lines: lines };
    };

    const deleteChunk = () => { };

    const getCameraChunk = () => {
        const cameraX = camera.position.x;
        const cameraZ = camera.position.z;
        const chunkX = Math.floor(cameraX / (chunkSize * chunkStep));
        const chunkZ = Math.floor(cameraZ / (chunkSize * chunkStep));
        return { x: chunkX, z: chunkZ };
    };

    const updateChunks = () => {
        const cameraChunk = getCameraChunk();
        const visibleChunks = [];
        for (let x = cameraChunk.x - visibleChunksRadius; x <= cameraChunk.x + visibleChunksRadius; x++) {
            for (let z = cameraChunk.z - visibleChunksRadius; z <= cameraChunk.z + visibleChunksRadius; z++) {
                visibleChunks.push({ x: x, z: z });
            }
        }
        visibleChunks.forEach(chunk => {
            createChunk(chunk.x, chunk.z);
        });
    };

    updateChunks();

    scene.onBeforeRenderObservable.add(() => {
        updateChunks();
    });

    return scene;
};


// Your existing CreateRoom function.  I'm not using it in the core generation but left it here for you.
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


function AddStaticPhysics(mesh, friction) {
    mesh.physicsImpostor = new BABYLON.PhysicsImpostor(mesh,
        BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: friction }, scene);
}
