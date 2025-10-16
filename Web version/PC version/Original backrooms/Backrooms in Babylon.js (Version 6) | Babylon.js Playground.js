const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

function createScene(engine, canvas) {
    const scene = new BABYLON.Scene(engine);

    // Камера
    const camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(2.5, 17, -0.36), scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    camera.attachControl(canvas, true);
    camera.target = new BABYLON.Vector3(2.487, 2.02, -0.36);
    camera.position = new BABYLON.Vector3(2.487, 17, -0.36);
    camera.rotation = new BABYLON.Vector3(1.569, -3.135, 0);

    // Свет
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.7;

    const CHUNK_SIZE = 100;
    const existingChunks = {};
    const texturePaths = [
        "https://i.postimg.cc/y83ChCs2/image.png",
        "https://cdn.pixabay.com/photo/2025/03/31/21/30/italy-9505446_1280.jpg",
        "https://i.postimg.cc/tCTKLspV/Joxi-2.jpg"// добавьте свои ресурсы
    ];

    const cubeSize = 2; // размер кубика стены
    const wallHeight = 22; // высота стены

    const baseCube = BABYLON.MeshBuilder.CreateBox("baseCube", { size: cubeSize }, scene);
    const baseMat = new BABYLON.StandardMaterial("baseMat", scene);
    baseMat.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8);
    baseCube.material = baseMat;
    baseCube.isVisible = false;

    function createWallFromMap(mapImageUrl, chunkX, chunkZ) {
        const wallTexture = new BABYLON.Texture(mapImageUrl, scene);
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            const ctx = document.createElement('canvas').getContext('2d');
            ctx.canvas.width = img.width;
            ctx.canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const divide = 50;
            const stepX = Math.floor(img.width / divide);
            const stepY = Math.floor(img.height / divide);
            const rgbLevel = 100;

            for (let y = 0; y < img.height; y += stepY) {
                for (let x = 0; x < img.width; x += stepX) {
                    const data = ctx.getImageData(x, y, 1, 1).data;
                    const r = data[0], g = data[1], b = data[2], a = data[3];
                    if (r < rgbLevel && g < rgbLevel && b < rgbLevel && a > 0) {
                        const worldX = (x / img.width - 0.5) * CHUNK_SIZE;
                        const worldZ = (y / img.height - 0.5) * CHUNK_SIZE;
                        const position = new BABYLON.Vector3(worldX + chunkX * CHUNK_SIZE, 0, worldZ + chunkZ * CHUNK_SIZE);
                        const cubeInstance = baseCube.createInstance(`wall_${chunkX}_${chunkZ}_${x}_${y}`);
                        cubeInstance.position = position;
                        cubeInstance.scaling.y = wallHeight / cubeSize;
                        cubeInstance.position.y = 0;
                        const mat = new BABYLON.StandardMaterial(`wallMat_${chunkX}_${chunkZ}_${x}_${y}`, scene);
                        mat.diffuseTexture = wallTexture;
                        cubeInstance.material = mat;
                        cubeInstance.checkCollisions = true;
                        cubeInstance.isVisible = true;
                    }
                }
            }
        };
        img.src = mapImageUrl;
    }

    function generateChunk(chunkX, chunkZ) {
        const chunkId = `${chunkX},${chunkZ}`;
        if (existingChunks[chunkId]) return;
        existingChunks[chunkId] = true;
        const mapUrl = texturePaths[Math.floor(Math.random() * texturePaths.length)];
        createWallFromMap(mapUrl, chunkX, chunkZ);
    }

    // Земля и потолок
    const groundMat = new BABYLON.StandardMaterial("groundMat", scene);
    const groundTexture = new BABYLON.Texture("https://i.postimg.cc/wvStLGvz/image.jpg", scene);
    groundTexture.uScale = 5;
    groundTexture.vScale = 5;
    groundMat.diffuseTexture = groundTexture;
    groundMat.backFaceCulling = false;
    groundMat.specularColor = new BABYLON.Color3(0, 0, 0); // Отключение блеска

    const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: CHUNK_SIZE * 5, height: CHUNK_SIZE * 5 }, scene);
    ground.material = groundMat;
    ground.position.x = 0;
    ground.position.z = 0;
    ground.position.y = -wallHeight / 2;

    const ceilingMat = new BABYLON.StandardMaterial("ceilingMat", scene);
    const ceilingTexture = new BABYLON.Texture("https://i.postimg.cc/y83ChCs2/image.png", scene);
    ceilingTexture.uScale = 5;
    ceilingTexture.vScale = 5;
    ceilingMat.diffuseTexture = ceilingTexture;
    ceilingMat.backFaceCulling = false;

    const ceiling = BABYLON.MeshBuilder.CreateGround("ceiling", { width: CHUNK_SIZE * 5, height: CHUNK_SIZE * 5 }, scene);
    ceiling.material = ceilingMat;
    ceiling.position.x = 0;
    ceiling.position.z = 0;
    ceiling.position.y = wallHeight / 2;

    // Освещение для потолка
    for (let i = 0; i < 4; i++) {
        new BABYLON.PointLight(`light${i}`, new BABYLON.Vector3(0, ceiling.position.y - 0.5, 0), scene);
    }

    scene.registerBeforeRender(() => {
        const pos = camera.position;
        const chunkX = Math.floor(pos.x / CHUNK_SIZE);
        const chunkZ = Math.floor(pos.z / CHUNK_SIZE);
        generateChunk(chunkX, chunkZ);
    });

    // Запуск рендеринга
    engine.runRenderLoop(() => {
        scene.render();
    });

    return scene;
}

// Создаем сцену
const scene = createScene(engine, canvas);

// Обработчик ресайза
window.addEventListener("resize", () => {
    engine.resize();
});
