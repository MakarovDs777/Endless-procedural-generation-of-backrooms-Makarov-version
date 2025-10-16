const createScene = function() {
    const scene = new BABYLON.Scene(engine);
    const camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(30, 50, -50), scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    camera.attachControl(canvas, true);
    const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);

    const chunkSize = 7;
    const chunkStep = 3;
    const visibleChunksRadius = 2;
    const existingChunks = {};

    // Значения масок:
    // 0: Не рисовать ничего.
    // 1: Рисовать горизонтальную линию (слева)
    // 2: Рисовать вертикальную линию (снизу)
    // 3: Рисовать диагональ вниз вправо
    // 4: Рисовать диагональ вверх вправо
    // 6: Рисовать вертикальную линию (справа)
    // 7: Рисовать горизонтальную линию (сверху)

    const masks = [
        [
            [7,7,7,7,7,7,7,7,7,7],
            [1,1,1,1,1,1,1,1,1,0],
            [2,1,0,0,0,0,0,0,1,0],
            [3,1,0,1,1,1,1,0,1,0],
            [4,1,0,1,0,0,1,0,1,0],
            [5,1,0,1,0,0,1,0,1,0],
            [6,1,0,1,1,1,1,0,1,0],
            [0,1,0,0,0,0,0,0,1,0],
            [0,1,1,1,1,1,1,1,1,0],
            [2,2,2,2,2,2,2,2,2,2],
        ],
        [
            [1,1,1,1,1,1,1,1,1,1],
            [1,0,0,0,0,0,0,0,0,1],
            [1,0,1,1,1,1,1,1,0,1],
            [1,0,1,0,0,0,0,1,0,1],
            [1,0,1,0,1,1,0,1,0,1],
            [1,0,1,0,1,1,0,1,0,1],
            [1,0,1,0,0,0,0,1,0,1],
            [1,0,1,1,1,1,1,1,0,1],
            [1,0,0,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,1,1,1,1],
        ],
        [
            [0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0],
            [0,0,1,1,1,1,1,1,0,0],
            [0,0,1,0,0,0,0,1,0,0],
            [0,0,1,0,0,0,0,1,0,0],
            [0,0,1,0,0,0,0,1,0,0],
            [0,0,1,0,0,0,0,1,0,0],
            [0,0,1,1,1,1,1,1,0,0],
            [0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0],
        ],
    ];


    const getRandomMask = () => {
        const randomIndex = Math.floor(Math.random() * masks.length);
        return masks[randomIndex];
    };

    const createWallSegment = (pointA, pointB) => {
        const wallHeight = 5;
        const wallThickness = 0.2;
        const direction = pointB.subtract(pointA);
        const distance = direction.length();
        const wallCenter = pointA.add(direction.scale(0.5));
        const wall = BABYLON.MeshBuilder.CreateBox("wall", { height: wallHeight, width: distance, depth: wallThickness }, scene);
        wall.position = wallCenter.add(new BABYLON.Vector3(0, wallHeight / 2, 0));
        wall.lookAt(pointB.add(new BABYLON.Vector3(0, wallHeight / 2, 0)));

        const wallMaterial = new BABYLON.StandardMaterial("wallMaterial", scene);
        const wallTexture = new BABYLON.Texture("https://i.postimg.cc/fTN3vyCh/wallpaper-new.jpg", scene);
        wallTexture.uScale = distance / 2;
        wallTexture.vScale = wallHeight / 2;
        wallMaterial.diffuseTexture = wallTexture;
        wall.material = wallMaterial;

        return wall;
    };

    const createChunk = (chunkX, chunkZ) => {
        const chunkId = `${chunkX}_${chunkZ}`;
        if (existingChunks[chunkId]) {
            return;
        }

        const walls = [];
        const mask = getRandomMask();

        for (let z = 0; z < chunkSize; z++) {
            for (let x = 0; x < chunkSize; x++) {
                const maskValue = mask[z][x];
                const baseX = (chunkX * chunkSize + x) * chunkStep;
                const baseZ = (chunkZ * chunkSize + z) * chunkStep;

                switch (maskValue) {
                    case 1: // Горизонтальная (слева)
                        const pointA_H = new BABYLON.Vector3(baseX, 0, baseZ);
                        const pointB_H = new BABYLON.Vector3(baseX + chunkStep, 0, baseZ);
                        const result_H = createWallSegment(pointA_H, pointB_H);
                        if (result_H) walls.push(result_H);
                        break;
                    case 2: // Вертикальная (снизу)
                        const pointA_V = new BABYLON.Vector3(baseX, 0, baseZ);
                        const pointB_V = new BABYLON.Vector3(baseX, 0, baseZ + chunkStep);
                        const result_V = createWallSegment(pointA_V, pointB_V);
                        if (result_V) walls.push(result_V);
                        break;
                    case 3: // Диагональ вниз
                        const pointA_D1 = new BABYLON.Vector3(baseX, 0, baseZ);
                        const pointB_D1 = new BABYLON.Vector3(baseX + chunkStep, 0, baseZ + chunkStep);
                        const result_D1 = createWallSegment(pointA_D1, pointB_D1);
                        if (result_D1) walls.push(result_D1);
                        break;
                    case 4: // Диагональ вверх
                        const pointA_D2 = new BABYLON.Vector3(baseX + chunkStep, 0, baseZ);
                        const pointB_D2 = new BABYLON.Vector3(baseX, 0, baseZ + chunkStep);
                        const result_D2 = createWallSegment(pointA_D2, pointB_D2);
                        if (result_D2) walls.push(result_D2);
                        break;
                    case 6: // Вертикальная (справа)
                        const pointA_V_Right = new BABYLON.Vector3(baseX + chunkStep, 0, baseZ);
                        const pointB_V_Right = new BABYLON.Vector3(baseX + chunkStep, 0, baseZ + chunkStep);
                        const result_V_Right = createWallSegment(pointA_V_Right, pointB_V_Right);
                        if (result_V_Right) walls.push(result_V_Right);
                        break;
                    case 7: // Горизонтальная (сверху)
                        const pointA_H_Top = new BABYLON.Vector3(baseX, 0, baseZ + chunkStep);
                        const pointB_H_Top = new BABYLON.Vector3(baseX + chunkStep, 0, baseZ + chunkStep);
                        const result_H_Top = createWallSegment(pointA_H_Top, pointB_H_Top);
                        if (result_H_Top) walls.push(result_H_Top);
                        break;
                }
            }
        }

        existingChunks[chunkId] = { walls: walls };
    };

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
