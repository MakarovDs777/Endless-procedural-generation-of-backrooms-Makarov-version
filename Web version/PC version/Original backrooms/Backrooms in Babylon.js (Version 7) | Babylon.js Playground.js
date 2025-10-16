function createScene() {
    var scene = new BABYLON.Scene(engine);

    var camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 1, -15), scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    camera.attachControl(canvas, true);

    var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.7;

    const CHUNK_SIZE = 4;
    const VIEW_RADIUS = 1;
    const LAMP_PROBABILITY = 0.01;  // Вероятность генерации лампы (50%)

    var chunks = {};

    var imageUrls = [
        'https://i.postimg.cc/MT1CTf38/ZxxPYoq4haA.jpg',
        'https://i.postimg.cc/4450Sgrw/1613700520.nicolasg37_draehead.jpg',
        'https://i.postimg.cc/7Lw7Y6G3/16456220115470s.jpg',
        'https://i.postimg.cc/xCB8PXM8/Полотно.jpg',
        'https://i.postimg.cc/xCB8PXM8/Полотно.jpg',
        'https://i.postimg.cc/xCB8PXM8/Полотно.jpg',
        'https://i.postimg.cc/xCB8PXM8/Полотно.jpg',
        'https://i.postimg.cc/xCB8PXM8/Полотно.jpg',
        'https://i.postimg.cc/xCB8PXM8/Полотно.jpg',
        'https://i.postimg.cc/xCB8PXM8/Полотно.jpg',
        'https://i.postimg.cc/xCB8PXM8/Полотно.jpg'
    ];

    const wallImageUrl = 'https://i.postimg.cc/xCB8PXM8/Полотно.jpg';

    var allTiles = [];
    var gridRows = 3;
    var gridCols = 5;

    var textures = [];
    var loadedCount = 0;

    function loadAndSliceAll(callback) {
        for (let url of imageUrls) {
            let img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
                let canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                let ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                let partWidth = Math.floor(img.width / gridCols);
                let partHeight = Math.floor(img.height / gridRows);
                for (let r = 0; r < gridRows; r++) {
                    for (let c = 0; c < gridCols; c++) {
                        let imageData = ctx.getImageData(c * partWidth, r * partHeight, partWidth, partHeight);
                        let tempCanvas = document.createElement('canvas');
                        tempCanvas.width = partWidth;
                        tempCanvas.height = partHeight;
                        tempCanvas.getContext('2d').putImageData(imageData, 0, 0);
                        let urlPart = tempCanvas.toDataURL();
                        allTiles.push({ url: url, dataUrl: urlPart });
                    }
                }
                loadedCount++;
                if (loadedCount === imageUrls.length) {
                    for (let tile of allTiles) {
                        textures.push({ url: tile.url, texture: new BABYLON.Texture(tile.dataUrl, scene) });
                    } callback();
                }
            };
            img.src = url;
        }
    }

    function createChunk(x, z, textureObj, isWall) {
        if (isWall) {
            // Создаем плоскость со стеной
            const plane = BABYLON.MeshBuilder.CreatePlane(`chunk_${x}_${z}`, { width: CHUNK_SIZE, height: CHUNK_SIZE }, scene);
            plane.rotation.x = Math.PI / 2;
            plane.position.x = x * CHUNK_SIZE;
            plane.position.z = z * CHUNK_SIZE;
            plane.position.y = 0;

            const rotations = [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2];
            plane.rotation.z = rotations[Math.floor(Math.random() * rotations.length)];

            const mat = new BABYLON.StandardMaterial(`mat_${x}_${z}`, scene);
            mat.diffuseTexture = textureObj.texture;
            mat.specularColor = new BABYLON.Color3(0, 0, 0);
            plane.material = mat;

            chunks[`${x}_${z}`] = plane;
        } else {
            // Создаем куб для пола (один на чанк)
            const cubeSize = CHUNK_SIZE;
            const cube = BABYLON.MeshBuilder.CreateBox(`cube_${x}_${z}`, { size: cubeSize }, scene);

            cube.position.x = x * CHUNK_SIZE;
            cube.position.z = z * CHUNK_SIZE;
            cube.position.y = cubeSize / 2; // Немного под землю

            const mat = new BABYLON.StandardMaterial(`cube_mat_${x}_${z}`, scene);
            mat.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);  // Серый цвет
            mat.specularColor = new BABYLON.Color3(0, 0, 0);
            cube.material = mat;
            chunks[`${x}_${z}`] = cube;  // Сохраняем куб
        }
    }


    function generateChunks() {
        const camX = Math.floor(camera.position.x / CHUNK_SIZE);
        const camZ = Math.floor(camera.position.z / CHUNK_SIZE);

        for (let x = camX - VIEW_RADIUS; x <= camX + VIEW_RADIUS; x++) {
            for (let z = camZ - VIEW_RADIUS; z <= camZ + VIEW_RADIUS; z++) {
                const key = `${x}_${z}`;

                if (!chunks[key]) {
                    const texIndex = Math.floor(Math.random() * textures.length);
                    const texInfo = textures[texIndex];

                    const isWall = (texInfo.url === wallImageUrl);

                    createChunk(x, z, texInfo, isWall);
                }

                // Потолок и свет для каждого чанка.
                if (!scene.getMeshByID(`ceiling_${x}_${z}`)) {
                    CreateCeilingAndLights({ x: x * CHUNK_SIZE, z: z * CHUNK_SIZE, y: 1 });  // Высота потолка 1 (можно настроить)
                }
            }
        }
    }

    function CreateCeilingAndLights(chunkPosition) {
        const ceilingMaterial = new BABYLON.StandardMaterial(`CeilingMaterial_${chunkPosition.x}_${chunkPosition.z}`, scene);
        const ceilingTexture = new BABYLON.Texture("https://i.postimg.cc/y83ChCs2/image.png", scene);  // Замените на URL текстуры потолка
        ceilingTexture.uScale = 5;
        ceilingTexture.vScale = 5;
        ceilingMaterial.diffuseTexture = ceilingTexture;
        ceilingMaterial.backFaceCulling = false;
        ceilingMaterial.specularColor = new BABYLON.Color3(0, 0, 0); // Отключение блеска

        const ceiling = BABYLON.MeshBuilder.CreateGround(`ceiling_${chunkPosition.x}_${chunkPosition.z}`, { width: CHUNK_SIZE, height: CHUNK_SIZE }, scene);
        ceiling.material = ceilingMaterial;
        ceiling.position.x = chunkPosition.x;
        ceiling.position.z = chunkPosition.z;
        ceiling.position.y = 2;  // Положение потолка.  Учитываем высоту кубиков.

        CreateLightsOnCeiling(ceiling.position);
    }

    function CreateLightsOnCeiling(ceilingPosition) {
        if (Math.random() < LAMP_PROBABILITY) {
            const lightSize = { width: 0.5, height: 0.2, depth: 0.5 }; // Уменьшил размер ламп
            const lampMaterial = new BABYLON.StandardMaterial("lampMaterial", scene);
            lampMaterial.emissiveColor = new BABYLON.Color3(1, 1, 0.8); // Цвет свечения (желтоватый)
            lampMaterial.specularColor = new BABYLON.Color3(0, 0, 0); // Убираем блики

            const lamp = BABYLON.MeshBuilder.CreateBox("lamp", lightSize, scene);
            lamp.material = lampMaterial;
            lamp.position.x = ceilingPosition.x;
            lamp.position.z = ceilingPosition.z;
            lamp.position.y = ceilingPosition.y+0.05;  // Располагаем лампу немного ниже потолка
        }
    }


    loadAndSliceAll(() => {
        scene.registerBeforeRender(() => {
            generateChunks();
        });
    });

    engine.runRenderLoop(() => {
        scene.render();
    });

    return scene;
}

function CreateRoom(position) { //Оставлено для совместимости, но не используется.
    const roomSize = { width: 20, height: 22, depth: 5 };
    const roomMaterial = new BABYLON.StandardMaterial("roomMaterial", scene);

    const wallTexture = new BABYLON.Texture("https://i.postimg.cc/fTN3vyCh/wallpaper-new.jpg", scene);
    roomMaterial.diffuseTexture = wallTexture;

    const room = BABYLON.MeshBuilder.CreateBox("room", roomSize, scene);
    room.position = position;
    room.material = roomMaterial;

    return room;
}
