const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

async function createScene() {
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

    // Камера
    const camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 20, -50), scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    camera.attachControl(canvas, true);

    // Свет
    const hemisphericLight = new BABYLON.HemisphericLight("hemLight", new BABYLON.Vector3(0, 1, 0), scene);
    hemisphericLight.intensity = 0.7;

    // Лампы
    for (let i = 0; i < 4; i++) {
        new BABYLON.PointLight(`lamp${i}`, new BABYLON.Vector3(Math.random() * 50 - 25, 20, Math.random() * 50 - 25), scene);
    }

    // Константы
    const CHUNK_SIZE = 100;
    const existingChunks = {};

    // UI для телепортации
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
        teleportButton.textContent = 'Телепортировать';
        teleportButton.style.margin = '5px';
        teleportButton.onclick = () => {
            const x = parseFloat(inputX.value);
            const y = parseFloat(inputY.value);
            const z = parseFloat(inputZ.value);
            camera.position = new BABYLON.Vector3(x, y, z);
        };
        uiContainer.appendChild(teleportButton);

        document.body.appendChild(uiContainer);
    };

    createUI();

    // Обновление координат
    scene.registerBeforeRender(() => {
        const pos = camera.position;
        document.getElementById('coordDisplay').textContent = `X:${pos.x.toFixed(1)} Y:${pos.y.toFixed(1)} Z:${pos.z.toFixed(1)}`;
        generateChunks(camera.position);
    });

    // Генерация чанков
    function generateChunks(position) {
        const chunkX = Math.floor(position.x / CHUNK_SIZE);
        const chunkZ = Math.floor(position.z / CHUNK_SIZE);
        for (let x = chunkX - 1; x <= chunkX + 1; x++) {
            for (let z = chunkZ - 1; z <= chunkZ + 1; z++) {
                const key = `${x},${z}`;
                if (!existingChunks[key]) {
                    existingChunks[key] = true;
                    createChunk(x, z);
                }
            }
        }
    }

    // Создание одного чанка
    function createChunk(cx, cz) {
        // Создаем пол и потолок
        const size = CHUNK_SIZE;
        const groundTexture = new BABYLON.Texture("https://i.postimg.cc/wvStLGvz/image.jpg", scene);
        groundTexture.uScale = 5;
        groundTexture.vScale = 5;
        const groundMat = new BABYLON.StandardMaterial(`groundMat_${cx}_${cz}`, scene);
        groundMat.diffuseTexture = groundTexture;
        const ground = BABYLON.MeshBuilder.CreateGround(`ground_${cx}_${cz}`, { width: size, height: size });
        ground.material = groundMat;
        ground.position.x = cx * size;
        ground.position.z = cz * size;
        ground.position.y = -1;
        AddStaticPhysics(ground, 300);

        const ceilingTexture = new BABYLON.Texture("https://i.postimg.cc/y83ChCs2/image.png", scene);
        ceilingTexture.uScale = 5;
        ceilingTexture.vScale = 5;
        const ceilingMat = new BABYLON.StandardMaterial(`ceilingMat_${cx}_${cz}`, scene);
        ceilingMat.diffuseTexture = ceilingTexture;
        const ceiling = BABYLON.MeshBuilder.CreateGround(`ceiling_${cx}_${cz}`, { width: size, height: size });
        ceiling.material = ceilingMat;
        ceiling.position.x = cx * size;
        ceiling.position.z = cz * size;
        ceiling.position.y = 20;
        AddStaticPhysics(ceiling, 300);

        // Создаем стены из изображения
        createWallsFromImage(`https://i.postimg.cc/MT1CTf38/ZxxPYoq4haA.jpg`, cx, cz);
    }

    // Создание стен из изображения
    function createWallsFromImage(imageUrl, chunkX, chunkZ) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const ctx = document.createElement('canvas').getContext('2d');
            ctx.canvas.width = img.width;
            ctx.canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            const divide = 20; // делений
            const stepX = Math.floor(img.width / divide);
            const stepY = Math.floor(img.height / divide);
            const rgbThreshold = 100;
            for (let y = 0; y < img.height; y += stepY) {
                for (let x = 0; x < img.width; x += stepX) {
                    const data = ctx.getImageData(x, y, 1, 1).data;
                    const r = data[0], g = data[1], b = data[2], a = data[3];
                    if (r < rgbThreshold && g < rgbThreshold && b < rgbThreshold && a > 0) {
                        const worldX = (x / img.width - 0.5) * 100;
                        const worldZ = (y / img.height - 0.5) * 100;
                        const position = new BABYLON.Vector3(
                            worldX + chunkX * CHUNK_SIZE,
                            10,
                            worldZ + chunkZ * CHUNK_SIZE
                        );
                        const partSizeX = (stepX / img.width) * 100;
                        const partSizeZ = (stepY / img.height) * 100;
                        const plane = BABYLON.MeshBuilder.CreatePlane(`wall_${x}_${y}_${chunkX}_${chunkZ}`, {
                            width: partSizeX,
                            height: partSizeZ
                        });
                        plane.position = position;
                        plane.rotation.x = Math.PI / 2;
                        plane.position.y = 5;
                        const mat = new BABYLON.StandardMaterial(`wallMat_${x}_${y}_${chunkX}_${chunkZ}`, scene);
                        mat.diffuseTexture = new BABYLON.Texture(imageUrl, scene);
                        plane.material = mat;
                    }
                }
            }
        };
        img.src = imageUrl;
    }

    // Вспомогательная функция для добавления физики
    function AddStaticPhysics(mesh, mass) {
        if (BABYLON.PhysicsImpostor) {
            mesh.physicsImpostor = new BABYLON.PhysicsImpostor(mesh, BABYLON.PhysicsImpostor.BoxImpostor, { mass: mass }, scene);
        }
    }

    // Инициализация физики
    scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), new BABYLON.CannonJSPlugin());

    return scene;
}

createScene().then(scene => {
    engine.runRenderLoop(() => {
        scene.render();
    });
});

window.addEventListener("resize", () => {
    engine.resize();
});
