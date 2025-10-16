let existingCubes = {};
const CUBE_SPACING = 5;

let scene;

const BuldingsExample = [
    "https://i.postimg.cc/DfXKL6fw/buildings-10-png-4.png",
    "https://i.postimg.cc/GhnnQD9J/buildings-11-png-3.png",
    "https://i.postimg.cc/x10DrSvX/buildings-12-png-34.png",
    "https://i.postimg.cc/pXQb1dFN/buildings-13-jpg-35.jpg",
    "https://i.postimg.cc/W1XRTf8X/buildings-16-jpg-39.jpg",
    "https://i.postimg.cc/CKQWfBW8/buildings-17-png-32.png",
    "https://i.postimg.cc/TwZMBL0x/buildings-3-png-14.png",
    "https://i.postimg.cc/ydJCfXFn/buildings-5-jpg-23.jpg",
    "https://i.postimg.cc/x8MDQfpz/buildings-9-png-22.png",
    "https://i.postimg.cc/6qsgMs65/images-20-jpg-27.jpg",
    "https://i.postimg.cc/WzMKK9tm/images-22-jpg-33.jpg",
    "https://i.postimg.cc/gcRfn04w/images-24-jpg-11.jpg",
    "https://i.postimg.cc/5t0h0qk1/images-3-jpg-28.jpg",
    "https://i.postimg.cc/J45v5dfM/images-34-jpg-16.jpg",
    "https://i.postimg.cc/pXH38t1s/images-37-jpg-12.jpg",
    "https://i.postimg.cc/rm4Y0hG6/Mesh-color-5-png-7.png",
    "https://i.postimg.cc/BbG7xxNj/Mesh-color-8-png-10.png"
];

const Other = [
    "https://i.postimg.cc/1XcCMfYJ/Mesh-color-22-png-41.png",
    "https://i.postimg.cc/Y21stsqY/Mesh-color-23-png-43.png",
];

const Roof = ["https://i.postimg.cc/VNdh1sdk/Mesh-color-1-png-1.png"];

const kirpich = ["https://i.postimg.cc/FRkwbF4B/buildings-17-jpg-15.jpg"];

const Asphalt = ["https://i.postimg.cc/4x4MLQGt/images-jpeg-42.jpg"];

const Dirt = ["https://i.postimg.cc/0yt4LK54/images-jpg-40.jpg"];

const CHUNK_SIZE = 100; // Размер чанка для земли
let existingGroundChunks = {}; //  Отслеживаем, какие чанки земли уже созданы

async function createScene() {
    const engine = new BABYLON.Engine(canvas);
    scene = new BABYLON.Scene(engine);

    const camera = new BABYLON.FreeCamera("FreeCam", new BABYLON.Vector3(0, 10, -10), scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    camera.attachControl(canvas, true);

    const hemisphericLight = new BABYLON.HemisphericLight("Hemispheric Light", new BABYLON.Vector3(1, 1, 0), scene);
    hemisphericLight.intensity = 0.7;

    scene.registerBeforeRender(() => {
        GenerateGroundChunks(camera.position); // Генерация ковра
        generateCubes(camera.position); // Генерация кубов
    });

    engine.runRenderLoop(() => {
        if (scene && scene.activeCamera) {
            scene.render();
        }
    });

    return scene;
}

function GenerateGroundChunks(position) {
    const chunkX = Math.floor(position.x / CHUNK_SIZE);
    const chunkZ = Math.floor(position.z / CHUNK_SIZE);

    for (let x = chunkX - 2; x <= chunkX + 2; x++) {
        for (let z = chunkZ - 2; z <= chunkZ + 2; z++) {
            const chunkId = `${x},${z}`;
            if (!existingGroundChunks[chunkId]) { // Проверяем, создан ли уже этот чанк
                const groundMaterial = new BABYLON.StandardMaterial(`GroundMaterial_${chunkId}`, scene);
                const groundTexture = new BABYLON.Texture("https://i.postimg.cc/wvStLGvz/image.jpg", scene);
                groundTexture.uScale = 5;
                groundTexture.vScale = 5;
                groundMaterial.diffuseTexture = groundTexture;

                const ground = BABYLON.MeshBuilder.CreateGround(chunkId, { width: CHUNK_SIZE, height: CHUNK_SIZE }, scene);
                ground.material = groundMaterial;
                ground.position.x = x * CHUNK_SIZE;
                ground.position.z = z * CHUNK_SIZE;
                ground.position.y = -0.5;  //  Немного выше, чем раньше
                existingGroundChunks[chunkId] = true; // Отмечаем, что этот чанк создан
            }
        }
    }
}

function generateCubes(position) {
    const cubeX = Math.floor(position.x / CUBE_SPACING);
    const cubeZ = Math.floor(position.z / CUBE_SPACING);

    for (let x = cubeX - 5; x <= cubeX + 5; x++) {
        for (let z = cubeZ - 5; z <= cubeZ + 5; z++) {
            const cubeId = `${x},${z}`;
            if (!existingCubes[cubeId]) {
                createRandomCube(x * CUBE_SPACING, z * CUBE_SPACING, cubeId);
                existingCubes[cubeId] = true;
            }
        }
    }
}

function createRandomCube(x, z, id) {
    const width = Math.random() * (7 - 3) + 3;
    const depth = Math.random() * (7 - 3) + 3;
    const height = Math.random() * (12 - 2) + 2;

    const cube = BABYLON.MeshBuilder.CreateBox(id, { width: width, depth: depth, height: height }, scene);
    cube.position.x = x;
    cube.position.z = z;
    cube.position.y = height / 2 - 0.5; //  Смещаем кубы вверх, чтобы они стояли на ковре

    const buildingTextureIndex = Math.floor(Math.random() * BuldingsExample.length);
    const buildingTexture = BuldingsExample[buildingTextureIndex];

    const roofTextureIndex = Math.floor(Math.random() * Roof.length);
    const roofTexture = Roof[roofTextureIndex];

    const faceUV = new Array(6);
    for (let i = 0; i < 4; i++) {
        faceUV[i] = new BABYLON.Vector4(0, 0, 1, 1);
    }
    faceUV[4] = new BABYLON.Vector4(0, 0, 1, 1);
    faceUV[5] = new BABYLON.Vector4(0, 0, 1, 1);

    const buildingMaterial = new BABYLON.StandardMaterial("buildingMaterial", scene);
    buildingMaterial.diffuseTexture = new BABYLON.Texture(buildingTexture, scene);

    const roofMaterial = new BABYLON.StandardMaterial("roofMaterial", scene);
    roofMaterial.diffuseTexture = new BABYLON.Texture(roofTexture, scene);

    const mat = new BABYLON.MultiMaterial("multi", scene);
    mat.subMaterials.push(buildingMaterial);
    mat.subMaterials.push(buildingMaterial);
    mat.subMaterials.push(buildingMaterial);
    mat.subMaterials.push(buildingMaterial);
    mat.subMaterials.push(roofMaterial);
    mat.subMaterials.push(roofMaterial);

    cube.subMeshes = [];
    const verticesCount = cube.getTotalVertices();

    cube.subMeshes.push(new BABYLON.SubMesh(0, 0, verticesCount, 0, 6, cube));
    cube.subMeshes.push(new BABYLON.SubMesh(1, 0, verticesCount, 6, 6, cube));
    cube.subMeshes.push(new BABYLON.SubMesh(2, 0, verticesCount, 12, 6, cube));
    cube.subMeshes.push(new BABYLON.SubMesh(3, 0, verticesCount, 18, 6, cube));
    cube.subMeshes.push(new BABYLON.SubMesh(4, 0, verticesCount, 24, 6, cube));
    cube.subMeshes.push(new BABYLON.SubMesh(5, 0, verticesCount, 30, 6, cube));
    cube.material = mat;
}

createScene();
