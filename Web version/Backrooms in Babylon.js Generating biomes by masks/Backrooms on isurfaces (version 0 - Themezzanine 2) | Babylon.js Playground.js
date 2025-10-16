// Полный код: Backrooms-inspired Generation + Marching Cubes + BabylonJS + Infinite Chunks (DEBUGGING)

/* ------------------ Perlin (ваш код, компактный) ------------------ */
const Perlin = (function () {
    const p = new Uint8Array(512);
    const permutation = [151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180];
    for (let i = 0; i < 256; ++i) p[256 + i] = p[i] = permutation[i];
    function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10) }
    function lerp(t, a, b) { return a + t * (b - a) }
    function grad(hash, x, y, z) {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : (h === 12 || h === 14 ? x : z);
        return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
    }
    return {
        noise: function (x, y, z) {
            const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
            x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
            const u = fade(x), v = fade(y), w = fade(z);
            const A = p[X] + Y, AA = p[A] + Z, AB = p[A + 1] + Z;
            const B = p[X + 1] + Y, BA = p[B] + Z, BB = p[B + 1] + Z;
            return lerp(w,
                lerp(v, lerp(u, grad(p[AA], x, y, z), grad(p[BA], x - 1, y, z)),
                    lerp(u, grad(p[AB], x, y - 1, z), grad(p[BB], x - 1, y - 1, z))),
                lerp(v, lerp(u, grad(p[AA + 1], x, y, z - 1), grad(p[BA + 1], x - 1, y, z - 1)),
                    lerp(u, grad(p[AB + 1], x, y - 1, z - 1), grad(p[BB + 1], x - 1, y - 1, z - 1))))
        }
    }
})();

/* ------------------ Marching Cubes tables (edgeTable и triTable) ------------------ */
const edgeTable = new Int32Array([
    0x0, 0x109, 0x203, 0x30a, 0x406, 0x50f, 0x605, 0x70c, 0x80c, 0x905, 0xa0f, 0xb06, 0xc0a, 0xd03, 0xe09, 0xf00,
    0x190, 0x99, 0x393, 0x29a, 0x596, 0x49f, 0x795, 0x69c, 0x99c, 0x895, 0xb9f, 0xa96, 0xd9a, 0xc93, 0xf99, 0xe90,
    0x230, 0x339, 0x33, 0x13a, 0x636, 0x73f, 0x435, 0x53c, 0xa3c, 0xb35, 0x83f, 0x936, 0xe3a, 0xf33, 0xc39, 0xd30,
    0x3a0, 0x2a9, 0x1a3, 0xaa, 0x7a6, 0x6af, 0x5a5, 0x4ac, 0xbac, 0xaa5, 0x9af, 0x8a6, 0xfaa, 0xea3, 0xda9, 0xca0,
    0x460, 0x569, 0x663, 0x76a, 0x66, 0x16f, 0x265, 0x36c, 0xc6c, 0xd65, 0xe6f, 0xf66, 0x86a, 0x963, 0xa69, 0xb60,
    0x5f0, 0x4f9, 0x7f3, 0x6fa, 0x1f6, 0xff, 0x3f5, 0x2fc, 0xdfc, 0xcf5, 0xfff, 0xef6, 0x9fa, 0x8f3, 0xbf9, 0xaf0,
    0x650, 0x759, 0x453, 0x55a, 0x256, 0x35f, 0x55, 0x15c, 0xe5c, 0xf55, 0xc5f, 0xd56, 0xa5a, 0xb53, 0x859, 0x950,
    0x7c0, 0x6c9, 0x5c3, 0x4ca, 0x3c6, 0x2cf, 0x1c5, 0xcc, 0xfcc, 0xec5, 0xdcf, 0xcc6, 0xbca, 0xac3, 0x9c9, 0x8c0,
    0x8c0, 0x9c9, 0xac3, 0xbca, 0xcc6, 0xdcf, 0xec5, 0xfcc, 0xcc, 0x1c5, 0x2cf, 0x3c6, 0x4ca, 0x5c3, 0x6c9, 0x7c0,
    0x950, 0x859, 0xb53, 0xa5a, 0xd56, 0xc5f, 0xf55, 0xe5c, 0x15c, 0x55, 0x35f, 0x256, 0x55a, 0x453, 0x759, 0x650,
    0xaf0, 0xbf9, 0x8f3, 0x9fa, 0xef6, 0xfff, 0xcf5, 0xdfc, 0x2fc, 0x3f5, 0xff, 0x1f6, 0x6fa, 0x7f3, 0x4f9, 0x5f0,
    0xb60, 0xa69, 0x963, 0x86a, 0xf66, 0xe6f, 0xd65, 0xc6c, 0x36c, 0x265, 0x16f, 0x66, 0x76a, 0x663, 0x569, 0x460,
    0xca0, 0xda9, 0xea3, 0xfaa, 0x8a6, 0x9af, 0xaa5, 0xbac, 0x4ac, 0x5a5, 0x6af, 0x7a6, 0xaa, 0x1a3, 0x2a9, 0x3a0,
    0xd30, 0xc39, 0xf33, 0xe3a, 0x936, 0x83f, 0xb35, 0xa3c, 0x53c, 0x435, 0x73f, 0x636, 0x13a, 0x33, 0x339, 0x230,
    0xe90, 0xf99, 0xc93, 0xd9a, 0xa96, 0xb9f, 0x895, 0x99c, 0x69c, 0x795, 0x49f, 0x596, 0x29a, 0x393, 0x99, 0x190,
    0xf00, 0xe09, 0xd03, 0xc0a, 0xb06, 0xa0f, 0x905, 0x80c, 0x70c, 0x605, 0x50f, 0x406, 0x30a, 0x203, 0x109, 0x0
]);

const triTable = [
    [], [0, 8, 3], [0, 1, 9], [1, 8, 3, 9, 8, 1], [1, 2, 10], [0, 8, 3, 1, 2, 10], [9, 2, 10, 0, 2, 9], [2, 8, 3, 2, 10, 8, 10, 9, 8],
    [3, 11, 2], [0, 11, 2, 8, 11, 0], [1, 9, 0, 2, 3, 11], [1, 11, 2, 1, 9, 11, 9, 8, 11], [3, 10, 1, 11, 10, 3], [0, 10, 1, 0, 8, 10, 8, 11, 10], [3, 9, 0, 3, 11, 9, 11, 10, 9], [9, 8, 10, 10, 8, 11],
    [4, 7, 8], [4, 3, 0, 7, 3, 4], [0, 1, 9, 8, 4, 7], [4, 1, 9, 4, 7, 1, 7, 3, 1], [1, 2, 10, 8, 4, 7], [3, 4, 7, 3, 0, 4, 1, 2, 10], [9, 2, 10, 9, 0, 2, 8, 4, 7], [2, 10, 9, 2, 9, 7, 2, 7, 3, 7, 9, 4],
    [8, 4, 7, 3, 11, 2], [11, 4, 7, 11, 2, 4, 2, 0, 4], [9, 0, 1, 8, 4, 7, 2, 3, 11], [4, 7, 11, 4, 11, 9, 9, 11, 2, 9, 2, 1], [3, 10, 1, 3, 11, 10, 7, 8, 4], [1, 11, 10, 1, 4, 11, 1, 0, 4, 7, 11, 4], [4, 7, 8, 9, 0, 11, 9, 11, 10, 11, 0, 3], [4, 7, 11, 4, 11, 9, 9, 11, 10],
    [9, 5, 4], [9, 5, 4, 0, 8, 3], [0, 5, 4, 1, 5, 0], [8, 5, 4, 8, 3, 5, 3, 1, 5], [1, 2, 10, 9, 5, 4], [3, 0, 8, 1, 2, 10, 4, 9, 5], [5, 2, 10, 5, 4, 2, 4, 0, 2], [2, 10, 5, 3, 2, 5, 3, 5, 4, 3, 4, 8],
    [9, 5, 4, 2, 3, 11], [0, 11, 2, 0, 8, 11, 4, 9, 5], [0, 5, 4, 0, 1, 5, 2, 3, 11], [2, 1, 5, 2, 5, 8, 2, 8, 11, 4, 8, 5], [10, 3, 11, 10, 1, 3, 9, 5, 4], [4, 9, 5, 0, 8, 1, 8, 10, 1, 8, 11, 10], [5, 4, 0, 5, 0, 11, 5, 11, 10, 11, 0, 3], [5, 4, 8, 5, 8, 10, 10, 8, 11],
    [9, 7, 8, 5, 7, 9], [9, 3, 0, 9, 5, 3, 5, 7, 3], [0, 7, 8, 0, 1, 7, 1, 5, 7], [1, 5, 3, 3, 5, 7], [9, 5, 4, 10, 1, 2, 8, 5, 7], [5, 7, 9, 7, 8, 9, 1, 2, 10, 0, 3, 4], [10, 5, 2, 2, 5, 7, 2, 7, 3, 4, 0, 8], [7, 2, 3, 7, 5, 2, 5, 10, 2, 4, 8, 9],
    [7, 8, 4, 3, 11, 2, 9, 5, 0, 5, 6, 0], [5, 0, 9, 5, 6, 0, 6, 2, 0, 7, 8, 4, 11, 2, 3], [2, 3, 11, 0, 1, 6, 0, 6, 4, 6, 1, 5, 7, 8, 4], [11, 2, 1, 11, 1, 7, 7, 1, 5, 4, 7, 5], [9, 5, 4, 10, 1, 3, 10, 3, 11, 3, 1, 0], [0, 8, 4, 1, 10, 5, 3, 11, 2,], [5, 10, 6, 4, 7, 8, 0, 3, 11, 0, 11, 9, 11, 10, 9], [10, 9, 5, 11, 10, 5, 11, 5, 7, 4, 8, 3],
    [5, 6, 11, 5, 11, 4, 4, 11, 8], [5, 6, 11, 5, 11, 4, 3, 0, 11, 0, 4, 11], [0, 1, 9, 11, 5, 6, 11, 4, 5, 11, 8, 4], [6, 11, 5, 1, 9, 3, 9, 8, 3, 4, 5, 9], [6, 11, 5, 10, 1, 2, 4, 8, 3, 4, 3, 9], [10, 1, 2, 5, 6, 11, 5, 11, 4, 4, 11, 8], [9, 0, 2, 9, 2, 5, 5, 2, 6, 4, 8, 3, 11, 10, 1], [6, 11, 5, 2, 3, 10, 3, 8, 10, 8, 9, 10, 4, 5, 9],
    [3, 2, 7, 7, 2, 6, 8, 4, 9, 5, 6, 11], [6, 11, 7, 2, 0, 4, 2, 4, 6, 4, 0, 9, 5, 6, 4], [1, 9, 0, 2, 3, 6, 3, 7, 6, 5, 6, 4], [1, 2, 5, 5, 2, 6, 3, 7, 8, 4, 5, 9], [10, 1, 2, 6, 11, 7, 5, 4, 9, 8, 3, 0], [7, 6, 11, 5, 4, 10, 4, 2, 10, 4, 0, 2, 1, 10, 2], [4, 8, 3, 4, 3, 6, 4, 6, 5, 6, 3, 2, 10, 1, 0], [5, 6, 11, 5, 11, 10, 4, 8, 3, 4, 3, 0],
    [9, 5, 4, 7, 6, 11], [4, 9, 5, 0, 8, 3, 11, 7, 6], [6, 11, 7, 0, 1, 4, 1, 5, 4], [6, 11, 7, 1, 5, 3, 5, 8, 3, 5, 4, 8], [1, 2, 10, 9, 5, 4, 6, 11, 7], [11, 7, 6, 1, 2, 10, 0, 8, 3, 4, 9, 5], [7, 6, 11, 5, 4, 10, 4, 2, 10, 4, 0, 2], [3, 4, 8, 3, 5, 4, 3, 2, 5, 10, 5, 2, 11, 7, 6],
    [7, 2, 3, 6, 2, 7, 5, 4, 9], [9, 5, 4, 0, 8, 6, 0, 6, 2, 6, 8, 7], [3, 6, 2, 3, 7, 6, 1, 5, 0, 5, 4, 0], [6, 2, 7, 2, 3, 7, 5, 4, 1, 4, 0, 1], [1, 2, 10, 9, 5, 4, 6, 7, 8, 6, 8, 11], [1, 2, 10, 0, 8, 3, 4, 9, 5, 7, 6, 11], [4, 0, 2, 4, 2, 5, 5, 2, 10, 7, 6, 11], [7, 6, 11, 5, 4, 8, 5, 8, 10, 10, 8, 3, 10, 3, 2],
    [5, 4, 9, 6, 11, 7, 2, 3, 8, 2, 8, 0], [0, 2, 5, 0, 5, 9, 2, 6, 5, 7, 6, 11, 8, 3, 4], [0, 1, 5, 0, 5, 4, 1, 2, 5, 6, 5, 2, 7, 6, 11], [11, 7, 6, 1, 2, 5, 2, 6, 5, 3, 4, 8, 3, 5, 4], [6, 11, 7, 10, 1, 3, 10, 3, 8, 10, 8, 5, 4, 9, 0], [10, 1, 0, 10, 0, 5, 5, 0, 4, 11, 7, 6, 3, 8, 2], [6, 11, 7, 5, 4, 10, 4, 2, 10, 4, 0, 2, 1, 10, 2], [6, 11, 7, 10, 5, 4, 10, 4, 2, 2, 4, 0, 3, 8, 9],
    [4, 9, 5, 7, 6, 11, 8, 3, 0], [0, 1, 9, 11, 7, 6, 4, 5, 8, 5, 3, 8, 5, 2, 3], [6, 11, 7, 1, 5, 0, 5, 4, 0, 3, 8, 2, 8, 0, 2], [1, 5, 2, 5, 6, 2, 7, 6, 11, 4, 8, 3, 4, 3, 0],
    [1, 3, 10, 3, 11, 10, 4, 9, 5, 7, 6, 11], [0, 8, 4, 1, 10, 5, 1, 5, 0, 11, 7, 6, 3, 2, 9], [5, 4, 0, 5, 0, 10, 10, 0, 2, 7, 6, 11, 8, 3, 1], [11, 7, 6, 10, 5, 4, 10, 4, 2, 2, 4, 0, 3, 8, 9],
    [6, 11, 7, 10, 5, 4, 10, 4, 2, 2, 4, 0, 1, 9, 3], [6, 11, 7, 1, 5, 10, 4, 9, 0, 8, 3, 2,], [4, 9, 5, 2, 3, 10, 3, 11, 10, 7, 6, 11], [6, 11, 7, 5, 4, 10, 4, 2, 10, 4, 0, 2,],
    []
];
const triTableFull = triTable; // Alias triTable to triTableFull

/* ------------------ Настройки / параметры ------------------ */
const params = {
    grid: { x: 32, y: 32, z: 32 },
    cubeSize: 2.0,       // Уменьшил размер кубиков, backrooms более детализированные
    threshold: 0.5,
    backroomsCubeSize: 5, // Размер кубов в Backrooms
    backroomsLevels: 1,  // Количество этажей в Backrooms
    backroomsCubesPerLevel: 3 // Кубов на каждом этаже
};

function vinterp(p1, p2, valp1, valp2, iso) {
    // если значения близки или iso совпадает — вернуть p1
    if (Math.abs(iso - valp1) < 1e-6) return p1.slice();
    if (Math.abs(iso - valp2) < 1e-6) return p2.slice();
    if (Math.abs(valp1 - valp2) < 1e-6) return p1.slice();
    const mu = (iso - valp1) / (valp2 - valp1);
    return [
        p1[0] + mu * (p2[0] - p1[0]),
        p1[1] + mu * (p2[1] - p1[1]),
        p1[2] + mu * (p2[2] - p1[2])
    ];
}

function marchingCubes(density, dimX, dimY, dimZ, iso, cellSize) {
    // density — Float32Array длины dimX*dimY*dimZ
    const getIdx = (x, y, z) => x + dimX * (y + dimY * z);
    const positions = [];
    const indices = [];
    // проход по кубам (каждый куб — между (x..x+1, y..y+1, z..z+1))
    for (let z = 0; z < dimZ - 1; z++) {
        for (let y = 0; y < dimY - 1; y++) {
            for (let x = 0; x < dimX - 1; x++) {
                // индекс вершин куба
                const cubeIndex = (function () {
                    let idx = 0;
                    const v0 = density[getIdx(x, y, z)] > iso;
                    const v1 = density[getIdx(x + 1, y, z)] > iso;
                    const v2 = density[getIdx(x + 1, y + 1, z)] > iso;
                    const v3 = density[getIdx(x, y + 1, z)] > iso;
                    const v4 = density[getIdx(x, y, z + 1)] > iso;
                    const v5 = density[getIdx(x + 1, y, z + 1)] > iso;
                    const v6 = density[getIdx(x + 1, y + 1, z + 1)] > iso;
                    const v7 = density[getIdx(x, y + 1, z + 1)] > iso;
                    if (v0) idx |= 1;
                    if (v1) idx |= 2;
                    if (v2) idx |= 4;
                    if (v3) idx |= 8;
                    if (v4) idx |= 16;
                    if (v5) idx |= 32;
                    if (v6) idx |= 64;
                    if (v7) idx |= 128;
                    return idx;
                })();

                const edges = edgeTable[cubeIndex];
                if (edges === 0) continue;

                const px = x * cellSize;
                const py = y * cellSize;
                const pz = z * cellSize;
                const cubeVerts = [
                    [px, py, pz],
                    [px + cellSize, py, pz],
                    [px + cellSize, py + cellSize, pz],
                    [px, py + cellSize, pz],
                    [px, py, pz + cellSize],
                    [px + cellSize, py, pz + cellSize],
                    [px + cellSize, py + cellSize, pz + cellSize],
                    [px, py + cellSize, pz + cellSize]
                ];
                const cubeVals = [
                    density[getIdx(x, y, z)],
                    density[getIdx(x + 1, y, z)],
                    density[getIdx(x + 1, y + 1, z)],
                    density[getIdx(x, y + 1, z)],
                    density[getIdx(x, y, z + 1)],
                    density[getIdx(x + 1, y, z + 1)],
                    density[getIdx(x + 1, y + 1, z + 1)],
                    density[getIdx(x, y + 1, z + 1)]
                ];

                const vertList = new Array(12);

                if (edgeTable[cubeIndex] & 1) vertList[0] = vinterp(cubeVerts[0], cubeVerts[1], cubeVals[0], cubeVals[1], iso);
                if (edgeTable[cubeIndex] & 2) vertList[1] = vinterp(cubeVerts[1], cubeVerts[2], cubeVals[1], cubeVals[2], iso);
                if (edgeTable[cubeIndex] & 4) vertList[2] = vinterp(cubeVerts[2], cubeVerts[3], cubeVals[2], cubeVals[3], iso);
                if (edgeTable[cubeIndex] & 8) vertList[3] = vinterp(cubeVerts[3], cubeVerts[0], cubeVals[3], cubeVals[0], iso);
                if (edgeTable[cubeIndex] & 16) vertList[4] = vinterp(cubeVerts[4], cubeVerts[5], cubeVals[4], cubeVals[5], iso);
                if (edgeTable[cubeIndex] & 32) vertList[5] = vinterp(cubeVerts[5], cubeVerts[6], cubeVals[5], cubeVals[6], iso);
                if (edgeTable[cubeIndex] & 64) vertList[6] = vinterp(cubeVerts[6], cubeVerts[7], cubeVals[6], cubeVals[7], iso);
                if (edgeTable[cubeIndex] & 128) vertList[7] = vinterp(cubeVerts[7], cubeVerts[4], cubeVals[7], cubeVals[4], iso);
                if (edgeTable[cubeIndex] & 256) vertList[8] = vinterp(cubeVerts[0], cubeVerts[4], cubeVals[0], cubeVals[4], iso);
                if (edgeTable[cubeIndex] & 512) vertList[9] = vinterp(cubeVerts[1], cubeVerts[5], cubeVals[1], cubeVals[5], iso);
                if (edgeTable[cubeIndex] & 1024) vertList[10] = vinterp(cubeVerts[2], cubeVerts[6], cubeVals[2], cubeVals[6], iso);
                if (edgeTable[cubeIndex] & 2048) vertList[11] = vinterp(cubeVerts[3], cubeVerts[7], cubeVals[3], cubeVals[7], iso);
                const triConfig = triTableFull[cubeIndex];
                if (!triConfig || triConfig.length === 0) continue;
                for (let t = 0; t < triConfig.length; t += 3) {
                    const a = vertList[triConfig[t]];
                    const b = vertList[triConfig[t + 1]];
                    const c = vertList[triConfig[t + 2]];
                    if (!a || !b || !c) continue;
                    const idx = positions.length / 3;
                    positions.push(a[0], a[1], a[2]);
                    positions.push(b[0], b[1], b[2]);
                    positions.push(c[0], c[1], c[2]);
                    indices.push(idx, idx + 1, idx + 2);
                }
            }
        }
    }
    const normals = new Float32Array(positions.length);
    for (let i = 0; i < indices.length; i += 3) {
        const ia = indices[i] * 3, ib = indices[i + 1] * 3, ic = indices[i + 2] * 3;
        const ax = positions[ia], ay = positions[ia + 1], az = positions[ia + 2];
        const bx = positions[ib], by = positions[ib + 1], bz = positions[ib + 2];
        const cx = positions[ic], cy = positions[ic + 1], cz = positions[ic + 2];
        const ux = bx - ax, uy = by - ay, uz = bz - az;
        const vx = cx - ax, vy = cy - ay, vz = cz - az;
        const nx = uy * vz - uz * vy;
        const ny = uz * vx - ux * vz;
        const nz = ux * vy - uy * vx;
        normals[ia] += nx; normals[ia + 1] += ny; normals[ia + 2] += nz;
        normals[ib] += nx; normals[ib + 1] += ny; normals[ib + 2] += nz;
        normals[ic] += nx; normals[ic + 1] += ny; normals[ic + 2] += nz;
    }
    for (let i = 0; i < normals.length; i += 3) {
        const nx = normals[i], ny = normals[i + 1], nz = normals[i + 2];
        const len = Math.hypot(nx, ny, nz) || 1.0;
        normals[i] = nx / len; normals[i + 1] = ny / len; normals[i + 2] = nz / len;
    }

    return {
        positions: new Float32Array(positions),
        indices: new Uint32Array(indices),
        normals: normals.length ? new Float32Array(normals) : null
    };
}

function marchingCubes(density, dimX, dimY, dimZ, iso, cellSize) {
    console.log("marchingCubes: dimX =", dimX, "dimY =", dimY, "dimZ =", dimZ, "iso =", iso, "cellSize =", cellSize);
    console.log("marchingCubes: density =", density);

    if (!density) {
        console.error("marchingCubes: density is null or undefined!");
        return null;
    }

    if (density.includes(NaN) || density.includes(Infinity)) {
        console.error("marchingCubes: density contains NaN or Infinity!");
        return null;
    }
    const getIdx = (x, y, z) => x + dimX * (y + dimY * z);
    const positions = [];
    const indices = [];
    // проход по кубам (каждый куб — между (x..x+1, y..y+1, z..z+1))
    for (let z = 0; z < dimZ - 1; z++) {
        for (let y = 0; y < dimY - 1; y++) {
            for (let x = 0; x < dimX - 1; x++) {
                // индекс вершин куба
                const cubeIndex = (function () {
                    let idx = 0;
                    const v0 = density[getIdx(x, y, z)] > iso;
                    const v1 = density[getIdx(x + 1, y, z)] > iso;
                    const v2 = density[getIdx(x + 1, y + 1, z)] > iso;
                    const v3 = density[getIdx(x, y + 1, z)] > iso;
                    const v4 = density[getIdx(x, y, z + 1)] > iso;
                    const v5 = density[getIdx(x + 1, y, z + 1)] > iso;
                    const v6 = density[getIdx(x + 1, y + 1, z + 1)] > iso;
                    const v7 = density[getIdx(x, y + 1, z + 1)] > iso;
                    if (v0) idx |= 1;
                    if (v1) idx |= 2;
                    if (v2) idx |= 4;
                    if (v3) idx |= 8;
                    if (v4) idx |= 16;
                    if (v5) idx |= 32;
                    if (v6) idx |= 64;
                    if (v7) idx |= 128;
                    return idx;
                })();
                  // if (true) continue;  ВРЕМЕННО ОТКЛЮЧАЕМ БОЛЬШУЮ ЧАСТЬ АЛГОРИТМА
                const edges = edgeTable[cubeIndex];
                if (edges === 0) continue;

                const px = x * cellSize;
                const py = y * cellSize;
                const pz = z * cellSize;
                const cubeVerts = [
                    [px, py, pz],
                    [px + cellSize, py, pz],
                    [px + cellSize, py + cellSize, pz],
                    [px, py + cellSize, pz],
                    [px, py, pz + cellSize],
                    [px + cellSize, py, pz + cellSize],
                    [px + cellSize, py + cellSize, pz + cellSize],
                    [px, py + cellSize, pz + cellSize]
                ];
                const cubeVals = [
                    density[getIdx(x, y, z)],
                    density[getIdx(x + 1, y, z)],
                    density[getIdx(x + 1, y + 1, z)],
                    density[getIdx(x, y + 1, z)],
                    density[getIdx(x, y, z + 1)],
                    density[getIdx(x + 1, y, z + 1)],
                    density[getIdx(x + 1, y + 1, z + 1)],
                    density[getIdx(x, y + 1, z + 1)]
                ];

                const vertList = new Array(12);

                if (edgeTable[cubeIndex] & 1) vertList[0] = vinterp(cubeVerts[0], cubeVerts[1], cubeVals[0], cubeVals[1], iso);
                if (edgeTable[cubeIndex] & 2) vertList[1] = vinterp(cubeVerts[1], cubeVerts[2], cubeVals[1], cubeVals[2], iso);
                if (edgeTable[cubeIndex] & 4) vertList[2] = vinterp(cubeVerts[2], cubeVerts[3], cubeVals[2], cubeVals[3], iso);
                if (edgeTable[cubeIndex] & 8) vertList[3] = vinterp(cubeVerts[3], cubeVerts[0], cubeVals[3], cubeVals[0], iso);
                if (edgeTable[cubeIndex] & 16) vertList[4] = vinterp(cubeVerts[4], cubeVerts[5], cubeVals[4], cubeVals[5], iso);
                if (edgeTable[cubeIndex] & 32) vertList[5] = vinterp(cubeVerts[5], cubeVerts[6], cubeVals[5], cubeVals[6], iso);
                if (edgeTable[cubeIndex] & 64) vertList[6] = vinterp(cubeVerts[6], cubeVerts[7], cubeVals[6], cubeVals[7], iso);
                if (edgeTable[cubeIndex] & 128) vertList[7] = vinterp(cubeVerts[7], cubeVerts[4], cubeVals[7], cubeVals[4], iso);
                if (edgeTable[cubeIndex] & 256) vertList[8] = vinterp(cubeVerts[0], cubeVerts[4], cubeVals[0], cubeVals[4], iso);
                if (edgeTable[cubeIndex] & 512) vertList[9] = vinterp(cubeVerts[1], cubeVerts[5], cubeVals[1], cubeVals[5], iso);
                if (edgeTable[cubeIndex] & 1024) vertList[10] = vinterp(cubeVerts[2], cubeVerts[6], cubeVals[2], cubeVals[6], iso);
                if (edgeTable[cubeIndex] & 2048) vertList[11] = vinterp(cubeVerts[3], cubeVerts[7], cubeVals[3], cubeVals[7], iso);
                const triConfig = triTableFull[cubeIndex];
                if (!triConfig || triConfig.length === 0) continue;
                for (let t = 0; t < triConfig.length; t += 3) {
                    const a = vertList[triConfig[t]];
                    const b = vertList[triConfig[t + 1]];
                    const c = vertList[triConfig[t + 2]];
                    if (!a || !b || !c) continue;
                    const idx = positions.length / 3;
                    positions.push(a[0], a[1], a[2]);
                    positions.push(b[0], b[1], b[2]);
                    positions.push(c[0], c[1], c[2]);
                    indices.push(idx, idx + 1, idx + 2);
                }
            }
        }
    }
    const normals = new Float32Array(positions.length);
    for (let i = 0; i < indices.length; i += 3) {
        const ia = indices[i] * 3, ib = indices[i + 1] * 3, ic = indices[i + 2] * 3;
        const ax = positions[ia], ay = positions[ia + 1], az = positions[ia + 2];
        const bx = positions[ib], by = positions[ib + 1], bz = positions[ib + 2];
        const cx = positions[ic], cy = positions[ic + 1], cz = positions[ic + 2];
        const ux = bx - ax, uy = by - ay, uz = bz - az;
        const vx = cx - ax, vy = cy - ay, vz = cz - az;
        const nx = uy * vz - uz * vy;
        const ny = uz * vx - ux * vz;
        const nz = ux * vy - uy * vx;
        normals[ia] += nx; normals[ia + 1] += ny; normals[ia + 2] += nz;
        normals[ib] += nx; normals[ib + 1] += ny; normals[ib + 2] += nz;
        normals[ic] += nx; normals[ic + 1] += ny; normals[ic + 2] += nz;
    }
    for (let i = 0; i < normals.length; i += 3) {
        const nx = normals[i], ny = normals[i + 1], nz = normals[i + 2];
        const len = Math.hypot(nx, ny, nz) || 1.0;
        normals[i] = nx / len; normals[i + 1] = ny / len; normals[i + 2] = nz / len;
    }

    return {
        positions: new Float32Array(positions),
        indices: new Uint32Array(indices),
        normals: normals.length ? new Float32Array(normals) : null
    };
}

let scene = null;
let engine = null;
let existingChunks = {};
const CHUNK_SIZE = 32; // Размер чанка в единицах сетки
const WORLD_SIZE = 128;  // Размер сетки квантовой пены

function createScene(canvas) {
    engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3(0.02, 0.03, 0.04);

    const camera = new BABYLON.FreeCamera("FreeCam", new BABYLON.Vector3(0, 10, -10), scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    camera.attachControl(canvas, true);
    camera.speed = 2;
    camera.inertia = 0.9;
    camera.checkCollisions = false;
    camera.applyGravity = false;

    const hemisphericLight = new BABYLON.HemisphericLight("Hemispheric Light", new BABYLON.Vector3(1, 1, 0), scene);
    hemisphericLight.intensity = 0.7;

    scene.registerBeforeRender(() => {
        GenerateBackroomsChunks(camera.position);
    });

    engine.runRenderLoop(() => {
        if (scene && scene.activeCamera) {
            scene.render();
        }
    });
    return scene;
}

function GenerateBackroomsChunks(position) {
    const cellSize = params.cubeSize / Math.max(params.grid.x - 1, 1);
    const chunkX = Math.floor(position.x / (cellSize * params.grid.x));
    const chunkZ = Math.floor(position.z / (cellSize * params.grid.z));
    const chunkY = Math.floor(position.y / (cellSize * params.grid.y)); // Added Y

    const renderRadius = 1;
    for (let x = chunkX - renderRadius; x <= chunkX + renderRadius; x++) {
        for (let y = chunkY - renderRadius; y <= chunkY + renderRadius; y++) { // Added Y
            for (let z = chunkZ - renderRadius; z <= chunkZ + renderRadius; z++) {
                const chunkId = `${x},${y},${z}`;
                if (!existingChunks[chunkId]) {
                    existingChunks[chunkId] = true;

                    const offsetX = x * params.grid.x;
                    const offsetY = y * params.grid.y;
                    const offsetZ = z * params.grid.z;

                    // Create density data for this chunk
                    const densityData = generateBackroomsChunkDensity(offsetX, offsetY, offsetZ);
                     console.log(`Chunk ${chunkId}: densityData = `, densityData); // DEBUG

                    const mc = marchingCubes(densityData, params.grid.x, params.grid.y, params.grid.z, params.threshold, cellSize);
                    console.log(`Chunk ${chunkId}: mc = `, mc); // DEBUG
                     console.log(`Chunk ${chunkId}: params.grid.x = `, params.grid.x, "params.grid.y = ", params.grid.y, "params.grid.z = ", params.grid.z, "params.threshold = ", params.threshold, "cellSize =", cellSize);
                    if (!mc) {
                        console.warn(`Chunk ${chunkId}: marchingCubes returned null/undefined!`);
                        continue; // Skip if marchingCubes fails
                    }

                    //if (!mc.positions || mc.positions.length === 0) {
                    //    console.warn(`Chunk ${chunkId}: No positions generated! Skipping.`);
                    //    continue; // Skip empty chunks
                    //}

                    const vertexData = new BABYLON.VertexData();
                    vertexData.positions = mc.positions;
                    vertexData.indices = mc.indices;
                    vertexData.normals = mc.normals;

                    const isoMesh = new BABYLON.Mesh(`isoMesh_${chunkId}`, scene);
                    vertexData.applyToMesh(isoMesh, true);

                    isoMesh.position.x = offsetX * cellSize;
                    isoMesh.position.y = offsetY * cellSize;
                    isoMesh.position.z = offsetZ * cellSize;

                    isoMesh.material = new BABYLON.StandardMaterial(`isoMat_${chunkId}`, scene);
                    isoMesh.material.diffuseColor = new BABYLON.Color3(0.8, 0.7, 0.5); // Dull yellow color
                    isoMesh.material.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1); // Almost no specular
                    isoMesh.material.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.1); // Slight emissive
                    isoMesh.material.backFaceCulling = false;
                    isoMesh.material.alpha = 1.0;
                }
            }
        }
    }
}

function generateBackroomsChunkDensity(offsetX, offsetY, offsetZ) {
    const density = new Float32Array(params.grid.x * params.grid.y * params.grid.z);
    const shape = [params.grid.x, params.grid.y, params.grid.z];
    console.log(`generateBackroomsChunkDensity: shape = `, shape); // DEBUG
    const array = generateDelaunayField(shape, offsetX, offsetY, offsetZ);
    for (let x = 0; x < params.grid.x; x++) {
        for (let y = 0; y < params.grid.y; y++) {
            for (let z = 0; z < params.grid.z; z++) {
                density[x + params.grid.x * (y + params.grid.x * z)] = array[x][y][z];
            }
        }
    }
    return density;
}

function generateDelaunayField(shape, offsetX, offsetY, offsetZ) {
   const array3D = Array(shape[0]).fill(null).map(() => Array(shape[1]).fill(null).map(() => new Array(shape[2]).fill(0.0)));

    const points = [];
     console.log(`generateDelaunayField: shape = `, shape); // DEBUG
    // Generate cubes on each level
    for (let level = 0; level < params.backroomsLevels; level++) {
        for (let _ = 0; _ < params.backroomsCubesPerLevel; _++) {
            const x = Math.floor(Math.random() * (shape[0] - 20)) + 10;
            const y = Math.floor(Math.random() * (shape[1] - 20)) + 10;
            const z = level * Math.floor(shape[2] / params.backroomsLevels) + Math.floor(Math.random() * (shape[2] / params.backroomsLevels - 20)) + 10;
            points.push([x, y, z]);
            generateCube(array3D, shape, x, y, z, Math.floor(Math.random() * 4) + params.backroomsCubeSize);
        }
    }

    // Generate corridors between cubes on different levels
    for (let i = 0; i < points.length - 1; i++) {
        const dx = points[i + 1][0] - points[i][0];
        const dy = points[i + 1][1] - points[i][1];
        const dz = points[i + 1][2] - points[i][2];
        const length_x = Math.abs(dx);
        const length_y = Math.abs(dy);
        const length_z = Math.abs(dz); // Allow Z-axis corridors

        for (let j = 0; j < Math.max(length_x, length_y, length_z); j++) {
            let new_x, new_y, new_z;
            if (j < length_x) {
                new_x = points[i][0] + Math.floor(j * dx / Math.max(length_x,1));
            } else {
                new_x = points[i + 1][0];
            }
            if (j < length_y) {
                new_y = points[i][1] + Math.floor(j * dy / Math.max(length_y,1));
            } else {
                new_y = points[i + 1][1];
            }
             if (j < length_z) {
                new_z = points[i][2] + Math.floor(j * dz / Math.max(length_z,1));
            } else {
                new_z = points[i + 1][2];
            }
            setSurrounding(array3D, shape, new_x, new_y, new_z, 1.0);
        }
    }
    return array3D;
}
function setSurrounding(array, shape, x, y, z, value) {
    for (let k = -2; k <= 2; k++) {
        for (let l = -2; l <= 2; l++) {
            for (let m = -2; m <= 2; m++) {
                const x1 = x + k, y1 = y + l, z1 = z + m;
                if (0 <= x1 && x1 < shape[0] && 0 <= y1 && y1 < shape[1] && 0 <= z1 && z1 < shape[2]) {
                    array[x1][y1][z1] = value;
                }
            }
        }
    }
}

function generateCube(array, shape, x, y, z, size) {
    for (let i = -size; i <= size; i++) {
        for (let j = -size; j <= size; j++) {
            for (let k = -size; k <= size; k++) {
                const new_x = x + i, new_y = y + j, new_z = z + k;
                 if (0 <= new_x && new_x < shape[0] && 0 <= new_y && new_y < shape[1] && 0 <= new_z && new_z < shape[2]) {
                    array[new_x][new_y][new_z] = 1.0;
                }
            }
        }
    }
}
// Простые функции для управления параметрами и камерой

const canvas = document.getElementById("renderCanvas") || (function () {
    const c = document.createElement("canvas");
    c.id = "renderCanvas";
    document.body.style.margin = 0;
    document.body.style.overflow = "hidden";
    document.body.appendChild(c);
    c.style.width = "100%";
    c.style.height = "100%";
    c.width = window.innerWidth;
    c.height = window.innerHeight;
    return c;
})();
const sceneNew = createScene(canvas);
