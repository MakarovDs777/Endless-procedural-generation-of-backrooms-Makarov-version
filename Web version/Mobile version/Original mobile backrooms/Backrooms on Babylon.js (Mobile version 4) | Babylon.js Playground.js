let existingChunks = {};
const CHUNK_SIZE = 100;
const LAMP_PROBABILITY = 0.5; // Вероятность генерации лампы (например, 50%)

// Создаем элементы для телепортации и отображения координат
const createUI = () => {
    // Контейнер для телепортации и координат
    const uiContainer = document.createElement('div');
    uiContainer.style.position = 'absolute';
    uiContainer.style.bottom = '0px';
    uiContainer.style.right = '210px';
    uiContainer.style.color = '#ffffff';
    uiContainer.style.display = 'flex'; // Используем флекс для выравнивания в ряд

    // Табло для координат
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
    teleportButton.textContent = 'Телепортироваться';
    teleportButton.style.margin = '5px';
    teleportButton.onclick = () => {
        const x = parseFloat(inputX.value);
        const y = parseFloat(inputY.value);
        const z = parseFloat(inputZ.value);
        teleportCamera(x, y, z);
    };
    uiContainer.appendChild(teleportButton);

    document.body.appendChild(uiContainer);
};


// Функция телепортации камеры
const teleportCamera = (x, y, z) => {
    camera.position = new BABYLON.Vector3(x, y, z);
    GenerateStructures(camera.position);
};

// Функция для создания сцены в Babylon.js
// Функция для создания сцены в Babylon.js
async function createScene() {
    const engine = new BABYLON.Engine(canvas);
    const scene = new BABYLON.Scene(engine);

    // Установка черного фона
    scene.clearColor = new BABYLON.Color4(0, 0, 0, 1); // RGBA

    camera = new BABYLON.FreeCamera("FreeCam", new BABYLON.Vector3(0, 10, -10), scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    camera.attachControl(canvas, true);

    const hemisphericLight = new BABYLON.HemisphericLight("Hemispheric Light", new BABYLON.Vector3(1, 1, 0), scene);
    hemisphericLight.intensity = 1;

    // Создание UI для джойстиков
    let adt = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true, scene);

    let xAddPos = 0;
    let yAddPos = 0;
    let xAddRot = 0;
    let yAddRot = 0;
    let sideJoystickOffset = 60;
    let bottomJoystickOffset = -40;

    // Создание левого джойстика
    let leftThumbContainer = makeThumbArea("leftThumb", 2, "blue", null);
    leftThumbContainer.height = "130px";
    leftThumbContainer.width = "130px";
    leftThumbContainer.isPointerBlocker = true;
    leftThumbContainer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    leftThumbContainer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    leftThumbContainer.alpha = 0.4;
    leftThumbContainer.left = sideJoystickOffset;
    leftThumbContainer.top = bottomJoystickOffset;

    let leftInnerThumbContainer = makeThumbArea("leftInnterThumb", 4, "blue", null);
    leftInnerThumbContainer.height = "55px";
    leftInnerThumbContainer.width = "55px";
    leftInnerThumbContainer.isPointerBlocker = false;
    leftInnerThumbContainer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    leftInnerThumbContainer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;

    let leftPuck = makeThumbArea("leftPuck", 0, "blue", "blue");
    leftPuck.height = "40px";
    leftPuck.width = "40px";
    leftPuck.isPointerBlocker = false;
    leftPuck.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    leftPuck.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;

    adt.addControl(leftThumbContainer);
    leftThumbContainer.addControl(leftInnerThumbContainer);
    leftThumbContainer.addControl(leftPuck);

    // Создание правого джойстика
    let rightThumbContainer = makeThumbArea("rightThumb", 2, "red", null);
    rightThumbContainer.height = "130px";
    rightThumbContainer.width = "130px";
    rightThumbContainer.isPointerBlocker = true;
    rightThumbContainer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    rightThumbContainer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    rightThumbContainer.alpha = 0.4;
    rightThumbContainer.left = -sideJoystickOffset;
    rightThumbContainer.top = bottomJoystickOffset;

    let rightInnerThumbContainer = makeThumbArea("rightInnterThumb", 4, "red", null);
    rightInnerThumbContainer.height = "55px";
    rightInnerThumbContainer.width = "55px";
    rightInnerThumbContainer.isPointerBlocker = false;
    rightInnerThumbContainer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    rightInnerThumbContainer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;

    let rightPuck = makeThumbArea("rightPuck", 0, "red", "red");
    rightPuck.height = "40px";
    rightPuck.width = "40px";
    rightPuck.isPointerBlocker = false;
    rightPuck.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    rightPuck.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;

    adt.addControl(rightThumbContainer);
    rightThumbContainer.addControl(rightInnerThumbContainer);
    rightThumbContainer.addControl(rightPuck);

    // Обработка событий джойстиков
    leftThumbContainer.onPointerDownObservable.add(function (coordinates) {
        leftPuck.isVisible = true;
        leftPuck.floatLeft = coordinates.x - (leftThumbContainer._currentMeasure.width *.5) - sideJoystickOffset;
        leftPuck.left = leftPuck.floatLeft;
        leftPuck.floatTop = adt._canvas.height - coordinates.y - (leftThumbContainer._currentMeasure.height *.5) + bottomJoystickOffset;
        leftPuck.top = leftPuck.floatTop * -1;
        leftPuck.isDown = true;
        leftThumbContainer.alpha = 0.9;
    });

    leftThumbContainer.onPointerUpObservable.add(function (coordinates) {
        xAddPos = 0;
        yAddPos = 0;
        leftPuck.isDown = false;
        leftPuck.isVisible = false;
        leftThumbContainer.alpha = 0.4;
    });

    leftThumbContainer.onPointerMoveObservable.add(function (coordinates) {
        if (leftPuck.isDown) {
            xAddPos = coordinates.x - (leftThumbContainer._currentMeasure.width *.5) - sideJoystickOffset;
            yAddPos = adt._canvas.height - coordinates.y - (leftThumbContainer._currentMeasure.height *.5) + bottomJoystickOffset;
            leftPuck.floatLeft = xAddPos;
            leftPuck.floatTop = yAddPos * -1;
            leftPuck.left = leftPuck.floatLeft;
            leftPuck.top = leftPuck.floatTop;
        }
    });

    rightThumbContainer.onPointerDownObservable.add(function (coordinates) {
        rightPuck.isVisible = true;
        rightPuck.floatLeft = adt._canvas.width - coordinates.x - (rightThumbContainer._currentMeasure.width *.5) - sideJoystickOffset;
        rightPuck.left = rightPuck.floatLeft * -1;
        rightPuck.floatTop = adt._canvas.height - coordinates.y - (rightThumbContainer._currentMeasure.height *.5) + bottomJoystickOffset;
        rightPuck.top = rightPuck.floatTop * -1;
        rightPuck.isDown = true;
        rightThumbContainer.alpha = 0.9;
    });

    rightThumbContainer.onPointerUpObservable.add(function (coordinates) {
        xAddRot = 0;
        yAddRot = 0;
        rightPuck.isDown = false;
        rightPuck.isVisible = false;
        rightThumbContainer.alpha = 0.4;
    });

    rightThumbContainer.onPointerMoveObservable.add(function (coordinates) {
        if (rightPuck.isDown) {
            xAddRot = adt._canvas.width - coordinates.x - (rightThumbContainer._currentMeasure.width *.5) - sideJoystickOffset;
            yAddRot = adt._canvas.height - coordinates.y - (rightThumbContainer._currentMeasure.height *.5) + bottomJoystickOffset;
            rightPuck.floatLeft = xAddRot * -1;
            rightPuck.floatTop = yAddRot * -1;
            rightPuck.left = rightPuck.floatLeft;
            rightPuck.top = rightPuck.floatTop;
        }
    });

    // Обновление положения камеры
    scene.registerBeforeRender(function () {
        translateTransform = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(xAddPos / 100, 0, yAddPos /100), BABYLON.Matrix.RotationY(camera.rotation.y));
        camera.position.addInPlace(translateTransform);
        camera.rotation.y += xAddRot / 12500 * -1;
        camera.rotation.x += yAddRot / 12500 * -1;
    });

    scene.registerBeforeRender(() => {
        updateCoordinatesDisplay(camera.position);
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

// Функция для отображения координат камеры
const updateCoordinatesDisplay = (position) => {
    const coordDisplay = document.getElementById('coordDisplay');
    coordDisplay.textContent = `Координаты: X: ${position.x.toFixed(2)}, Y: ${position.y.toFixed(2)}, Z: ${position.z.toFixed(2)}`;
};

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
                groundMaterial.specularColor = new BABYLON.Color3(0, 0, 0); // Отключение блеска

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

                // Создание ламп с учетом вероятности
                CreateLightsOnCeiling(ceiling.position);
            }
        }
    }
}

function CreateLightsOnCeiling(ceilingPosition) {
    const lightSize = { width: 5, height: 0.2, depth: 5 };
    const lampMaterial = new BABYLON.StandardMaterial("lampMaterial", scene);
    lampMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1); // Цвет свечения (например, белый)
    
    for (let offsetX = -CHUNK_SIZE / 2; offsetX <= CHUNK_SIZE / 2; offsetX += 20) {
        for (let offsetZ = -CHUNK_SIZE / 2; offsetZ <= CHUNK_SIZE / 2; offsetZ += 20) {
            if (Math.random() < LAMP_PROBABILITY) { // Условие для случайной генерации
                const lamp = BABYLON.MeshBuilder.CreateBox("lamp", lightSize, scene);
                lamp.material = lampMaterial;
                lamp.position.x = ceilingPosition.x + offsetX;
                lamp.position.z = ceilingPosition.z + offsetZ;
                lamp.position.y = ceilingPosition.y + 0; // Немного ниже потолка
            }
        }
    }
}

function AddStaticPhysics(mesh, friction) {
    mesh.physicsImpostor = new BABYLON.PhysicsImpostor(mesh,
        BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: friction }, scene);
}

// Функция создания круглого элемента для джойстика
function makeThumbArea(name, thickness, color, background) {
    let rect = new BABYLON.GUI.Ellipse();
    rect.name = name;
    rect.thickness = thickness;
    rect.color = color;
    rect.background = background;
    rect.paddingLeft = "0px";
    rect.paddingRight = "0px";
    rect.paddingTop = "0px";
    rect.paddingBottom = "0px";
    return rect;
}

// Создание интерфейса
createUI();

// Инициализация сцены
createScene();
