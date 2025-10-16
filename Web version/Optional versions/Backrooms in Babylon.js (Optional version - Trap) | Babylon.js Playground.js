let existingChunks = {};
const CHUNK_SIZE = 100;
const MAX_DEPTH = 6;
const LOAD_RADIUS = 2;
const TEXTURE_URL = "https://i.postimg.cc/Pq7xgZY0/wallpaper.jpg";
const biomes = [{

vertices: [[-9.872526, -9.872527, -9.872525], [-9.872526, -4.936264, -4.936263], [-4.936263, -9.872526, -4.936262], [-4.936263, -4.936264, -9.872526], [-4.936263, -4.936264, -4.936263], [-9.872526, -9.872525, 9.872527], [-9.872526, -4.936263, 4.936264], [-4.936263, -9.872526, 4.936264], [-4.936263, -4.936263, 4.936264], [-4.936263, -4.936262, 9.872526], [-9.872526, 9.872525, -9.872527], [-9.872526, 4.936263, -4.936264], [-4.936263, 4.936262, -9.872526], [-4.936263, 4.936263, -4.936264], [-4.936263, 9.872526, -4.936264], [-9.872526, 4.936264, 4.936263], [-9.872526, 9.872527, 9.872525], [-4.936263, 4.936264, 4.936263], [-4.936263, 4.936264, 9.872526], [-4.936263, 9.872526, 4.936262], [9.872526, -9.872527, -9.872525], [4.936263, -9.872526, -4.936262], [4.936263, -4.936264, -9.872526], [4.936263, -4.936264, -4.936263], [9.872526, -4.936264, -4.936263], [4.936263, -9.872526, 4.936264], [9.872526, -9.872525, 9.872527], [4.936263, -4.936263, 4.936264], [4.936263, -4.936262, 9.872526], [9.872526, -4.936263, 4.936264], [4.936263, 4.936262, -9.872526], [9.872526, 9.872525, -9.872527], [4.936263, 4.936263, -4.936264], [4.936263, 9.872526, -4.936264], [9.872526, 4.936263, -4.936264], [4.936263, 4.936264, 4.936263], [4.936263, 4.936264, 9.872526], [4.936263, 9.872526, 4.936262], [9.872526, 4.936264, 4.936263], [9.872526, 9.872527, 9.872525]],
faces: [[0, 5, 1], [0, 2, 7], [0, 1, 11], [0, 10, 3], [11, 1, 4], [4, 1, 8], [0, 3, 22], [2, 0, 20], [7, 2, 4], [4, 2, 23], [3, 12, 4], [22, 3, 4], [5, 0, 7], [5, 6, 1], [8, 1, 6], [6, 5, 16], [5, 9, 18], [8, 6, 17], [7, 4, 8], [5, 7, 25], [25, 7, 8], [9, 5, 26], [8, 17, 9], [8, 9, 27], [10, 0, 11], [12, 3, 10], [11, 4, 13], [10, 11, 15], [15, 11, 13], [10, 16, 14], [13, 4, 12], [10, 14, 33], [13, 12, 32], [12, 10, 31], [13, 14, 17], [33, 14, 13], [17, 6, 15], [16, 5, 18], [15, 6, 16], [16, 10, 15], [15, 13, 17], [16, 
19, 14], [18, 9, 17], [17, 14, 19], [16, 18, 36], [17, 19, 35], [18, 17, 36], [19, 16, 39], [20, 0, 22], [20, 21, 2], [23, 2, 21], [22, 4, 23], [23, 21, 27], [21, 20, 26], [20, 24, 29], [20, 22, 30], [23, 32, 22], [24, 20, 31], [32, 23, 24], [29, 24, 23], [26, 5, 25], [25, 8, 27], [26, 28, 9], [27, 9, 28], [27, 21, 25], [26, 25, 21], [26, 20, 29], [29, 23, 27], [27, 28, 36], [26, 29, 38], [29, 27, 38], [28, 26, 39], [32, 12, 30], [31, 10, 33], [30, 12, 31], [33, 13, 32], [30, 22, 32], [31, 20, 30], [31, 34, 24], [32, 24, 34], [32, 34, 35], [31, 33, 37], [33, 32, 37], [34, 31, 39], [36, 17, 35], [35, 19, 37], [39, 16, 36], [37, 19, 39], [36, 35, 27], [38, 27, 35], [36, 28, 39], [39, 26, 38], [37, 32, 35], [35, 34, 38], [39, 38, 34], [39, 31, 37]],

        texture: TEXTURE_URL
    },
];

// Используем Set для быстрого определения, был ли чанк сгенерирован
const generatedChunks = new Set();

function createMeshFromArrays(vertices, faces, scene, chunkId, xOffset, yOffset, zOffset, textureURL) {
    const positions = [];
    const indices = [];
    const uvs = [];

    vertices.forEach(v => {
        positions.push(v[0] * CHUNK_SIZE + xOffset, v[1] * CHUNK_SIZE + yOffset, v[2] * CHUNK_SIZE + zOffset);
        uvs.push((v[0] + 0.5), (v[2] + 0.5)); // Исправленные UV координаты
    });

    faces.forEach(face => {
        indices.push(face[0], face[1], face[2]);
    });

    const mesh = new BABYLON.Mesh(chunkId, scene);
    const vertexData = new BABYLON.VertexData();
    vertexData.positions = positions;
    vertexData.indices = indices;
    vertexData.uvs = uvs;
    vertexData.applyToMesh(mesh, true);

    const material = new BABYLON.StandardMaterial(`mat_${chunkId}`, scene);
    material.diffuseTexture = new BABYLON.Texture(textureURL, scene);
    material.backFaceCulling = false;
    mesh.material = material;
    mesh.isPickable = false;
    mesh.receiveShadows = false;

    existingChunks[chunkId] = mesh; // Сохраняем меш в existingChunks
    return mesh;
}

function createCorridor(chunkId, chunkX, chunkY, chunkZ, scene) {
    const biome = biomes[Math.floor(Math.random() * biomes.length)];
    const worldX = chunkX * CHUNK_SIZE;
    const worldY = chunkY * CHUNK_SIZE;
    const worldZ = chunkZ * CHUNK_SIZE;
    return createMeshFromArrays(biome.vertices, biome.faces, scene, chunkId, worldX, worldY, worldZ, biome.texture);
}

function GenerateChunks(position, scene) {
    const chunkX = Math.floor(position.x / CHUNK_SIZE);
    const chunkZ = Math.floor(position.z / CHUNK_SIZE);
    const chunkY = Math.floor(position.y / CHUNK_SIZE);

    for (let x = chunkX - LOAD_RADIUS; x <= chunkX + LOAD_RADIUS; x++) {
        for (let z = chunkZ - LOAD_RADIUS; z <= chunkZ + LOAD_RADIUS; z++) {
            const yTop = Math.min(chunkY, 0);
            for (let y = yTop - MAX_DEPTH; y <= yTop; y++) {
                const chunkId = `${x},${y},${z}`;

                // Проверяем, был ли уже сгенерирован этот чанк
                if (!generatedChunks.has(chunkId)) {
                    createCorridor(chunkId, x, y, z, scene);
                    generatedChunks.add(chunkId); // Добавляем в Set сгенерированный чанк
                }
            }
        }
    }

    //Очистка памяти
    Object.keys(existingChunks).forEach(chunkId =>{
        if(Math.abs(chunkX-parseInt(chunkId.split(',')[0])) > LOAD_RADIUS+1 ||
           Math.abs(chunkZ-parseInt(chunkId.split(',')[2])) > LOAD_RADIUS+1 ||
           Math.abs(chunkY-parseInt(chunkId.split(',')[1])) > MAX_DEPTH+1){
            if(existingChunks[chunkId]){
                existingChunks[chunkId].dispose();
                delete existingChunks[chunkId];
                generatedChunks.delete(chunkId);
            }
        }
    });
}

async function createScene() {
    const canvas = document.getElementById("renderCanvas");
    if (!canvas) throw new Error("Canvas with id 'renderCanvas' not found.");
    const engine = new BABYLON.Engine(canvas, true);
    const scene = new BABYLON.Scene(engine);

    const camera = new BABYLON.FreeCamera("FreeCam", new BABYLON.Vector3(0, 10, -10), scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    camera.attachControl(canvas, true);
    camera.speed = 2;

    const light = new BABYLON.HemisphericLight("Hemi", new BABYLON.Vector3(0.5, 1, 0.5), scene);
    light.intensity = 0.8;

    scene.registerBeforeRender(() => {
        GenerateChunks(camera.position, scene)
    });

    engine.runRenderLoop(() => scene.render());
    window.addEventListener("resize", () => engine.resize());
    return scene
}

window.addEventListener("DOMContentLoaded", async () => {
    try {
        await createScene();
        console.log("Scene created: only biome meshes are generated, duplicates prevented.")
    } catch (e) {
        console.error(e)
    }
});
