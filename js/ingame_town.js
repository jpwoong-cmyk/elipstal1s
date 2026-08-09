import * as THREE from "three";


const PALETTE = {
    grass: 0x405f35,
    grassDark: 0x2b4729,
    grassLight: 0x587443,

    dirt: 0x806641,
    dirtDark: 0x5e4b34,
    path: 0x9a8156,

    plaster: 0xb9ad8c,
    timber: 0x493522,
    timberDark: 0x2f2319,

    roof: 0x6c3f2a,
    roofDark: 0x44291f,

    stone: 0x777a72,
    stoneDark: 0x4f544e,

    crop: 0x6f853d,
    cropLight: 0x91a651,

    water: 0x315a63,

    maleCloth: 0x42566a,
    femaleCloth: 0x6b4c63,
    childCloth: 0x796742,

    skin: 0xc49a78,
    hair: 0x302820
};


const BUILDING_OBSTACLES = [
    { x: -7.5, z: -4.5, w: 6.0, d: 5.2 },
    { x: 7.0, z: -5.0, w: 6.4, d: 5.4 },
    { x: -7.0, z: 6.3, w: 5.8, d: 5.0 },
    { x: 7.4, z: 6.4, w: 6.0, d: 5.0 },
    { x: 13.0, z: 7.2, w: 7.5, d: 6.0 }
];


const CIRCULAR_OBSTACLES = [
    {
        id: "town-well",
        x: 0,
        z: 1,
        radius: 2.15
    }
];


/* ============================================================
   WALKABLE TOWN NAVIGATION GRID
   ------------------------------------------------------------
   Villagers use A* pathfinding across a navigation grid.
   Buildings and the well are removed from the walkable cells,
   so routes are calculated around them before movement begins.
============================================================ */

const NAVIGATION = {
    minX: -15,
    maxX: 15,
    minZ: -12.5,
    maxZ: 12.5,

    cellSize: 0.85,

    /*
     * Keeps wandering focused around the visible town rather
     * than sending villagers deep into the wilderness.
     */
    ellipseRadiusX: 14.5,
    ellipseRadiusZ: 11.8,

    buildingMargin: 0.95,
    wellMargin: 0.75
};


let NAV_GRID = null;
let WALKABLE_CELLS = [];


function seededRandom(seed = 0xEC1A17) {

    let value = seed >>> 0;


    return () => {

        value += 0x6D2B79F5;

        let t = value;

        t = Math.imul(
            t ^ t >>> 15,
            t | 1
        );

        t ^=
            t +
            Math.imul(
                t ^ t >>> 7,
                t | 61
            );

        return (
            (
                t ^
                t >>> 14
            ) >>>
            0
        ) /
        4294967296;

    };

}


const random = seededRandom();


function randomBetween(
    min,
    max
) {

    return (
        min +
        (
            max -
            min
        ) *
        random()
    );

}


function randomChoice(items) {

    return items[
        Math.floor(
            random() *
            items.length
        )
    ];

}


function setShadow(
    object,
    cast = true,
    receive = true
) {

    object.traverse(
        (child) => {

            if (!child.isMesh) return;

            child.castShadow = cast;
            child.receiveShadow = receive;

        }
    );

}


function makeMaterial(
    color,
    options = {}
) {

    return new THREE.MeshStandardMaterial({
        color,
        roughness:
            options.roughness ??
            0.92,
        metalness:
            options.metalness ??
            0,
        flatShading:
            options.flatShading ??
            false
    });

}


function createGround() {

    const group =
        new THREE.Group();


    const groundGeometry =
        new THREE.PlaneGeometry(
            76,
            58,
            48,
            36
        );


    const positions =
        groundGeometry.attributes.position;


    for (
        let index = 0;
        index < positions.count;
        index += 1
    ) {

        const x =
            positions.getX(
                index
            );

        const y =
            positions.getY(
                index
            );


        const undulation =
            Math.sin(
                x *
                0.42
            ) *
            0.055 +
            Math.cos(
                y *
                0.38
            ) *
            0.045;


        positions.setZ(
            index,
            undulation
        );

    }


    positions.needsUpdate =
        true;


    groundGeometry.computeVertexNormals();


    const ground =
        new THREE.Mesh(
            groundGeometry,
            makeMaterial(
                PALETTE.grass,
                {
                    roughness: 1
                }
            )
        );


    ground.rotation.x =
        -Math.PI /
        2;

    ground.receiveShadow =
        true;


    group.add(
        ground
    );


    /*
     * Subtle irregular grass/dirt patches.
     */

    for (
        let index = 0;
        index < 24;
        index += 1
    ) {

        const radius =
            randomBetween(
                1.3,
                4.0
            );


        const patch =
            new THREE.Mesh(
                new THREE.CircleGeometry(
                    radius,
                    18
                ),
                makeMaterial(
                    random() >
                    0.55
                        ? PALETTE.grassLight
                        : PALETTE.grassDark,
                    {
                        roughness: 1
                    }
                )
            );


        patch.rotation.x =
            -Math.PI /
            2;

        patch.position.set(
            randomBetween(
                -34,
                34
            ),
            0.018,
            randomBetween(
                -25,
                25
            )
        );

        patch.scale.y =
            randomBetween(
                0.45,
                0.92
            );

        patch.material.transparent =
            true;

        patch.material.opacity =
            randomBetween(
                0.10,
                0.24
            );

        patch.receiveShadow =
            true;


        group.add(
            patch
        );

    }


    return group;

}


function createPathSegment({
    x,
    z,
    width,
    depth,
    rotation = 0
}) {

    const path =
        new THREE.Mesh(
            new THREE.PlaneGeometry(
                width,
                depth
            ),
            makeMaterial(
                PALETTE.path,
                {
                    roughness: 1
                }
            )
        );


    path.rotation.x =
        -Math.PI /
        2;

    path.rotation.z =
        rotation;

    path.position.set(
        x,
        0.035,
        z
    );

    path.receiveShadow =
        true;


    return path;

}


function addTownPaths(
    scene
) {

    const segments = [
        {
            x: 0,
            z: 0,
            width: 4.5,
            depth: 22
        },
        {
            x: 0,
            z: 0,
            width: 4.5,
            depth: 24,
            rotation:
                Math.PI /
                2
        },
        {
            x: 9.6,
            z: 6.7,
            width: 2.6,
            depth: 9.5,
            rotation:
                -Math.PI /
                4.4
        }
    ];


    segments.forEach(
        (config) => {

            scene.add(
                createPathSegment(
                    config
                )
            );

        }
    );

}


function createHut({
    x,
    z,
    scale = 1,
    rotation = 0,
    roofColor = PALETTE.roof
}) {

    const hut =
        new THREE.Group();


    hut.position.set(
        x,
        0,
        z
    );

    hut.rotation.y =
        rotation;

    hut.scale.setScalar(
        scale
    );


    const wallMaterial =
        makeMaterial(
            PALETTE.plaster
        );

    const timberMaterial =
        makeMaterial(
            PALETTE.timber
        );

    const roofMaterial =
        makeMaterial(
            roofColor
        );


    const wall =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                4.6,
                2.4,
                3.8
            ),
            wallMaterial
        );


    wall.position.y =
        1.2;


    hut.add(
        wall
    );


    /*
     * Two roof planes create a gabled roof
     * without needing external models.
     */

    const roofLeft =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                3.3,
                0.35,
                4.6
            ),
            roofMaterial
        );


    roofLeft.rotation.z =
        0.56;

    roofLeft.position.set(
        -1.22,
        3.22,
        0
    );


    const roofRight =
        roofLeft.clone();

    roofRight.rotation.z =
        -0.56;

    roofRight.position.x =
        1.22;


    hut.add(
        roofLeft,
        roofRight
    );


    const door =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.8,
                1.55,
                0.18
            ),
            makeMaterial(
                PALETTE.timberDark
            )
        );


    door.position.set(
        0,
        0.85,
        1.99
    );


    hut.add(
        door
    );


    /*
     * Timber frame beams add visual depth.
     */

    const beamHorizontal =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                4.78,
                0.18,
                0.18
            ),
            timberMaterial
        );


    beamHorizontal.position.set(
        0,
        1.45,
        1.99
    );


    const beamLeft =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.17,
                2.35,
                0.18
            ),
            timberMaterial
        );


    beamLeft.position.set(
        -1.62,
        1.25,
        1.99
    );


    const beamRight =
        beamLeft.clone();

    beamRight.position.x =
        1.62;


    hut.add(
        beamHorizontal,
        beamLeft,
        beamRight
    );


    const chimney =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.55,
                1.1,
                0.55
            ),
            makeMaterial(
                PALETTE.stoneDark
            )
        );


    chimney.position.set(
        1.25,
        3.6,
        -0.5
    );


    hut.add(
        chimney
    );


    setShadow(
        hut,
        true,
        true
    );


    return hut;

}


function createFarm() {

    const farm =
        new THREE.Group();


    farm.position.set(
        13,
        0.02,
        7.2
    );

    farm.rotation.y =
        -0.05;


    const soil =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                7.2,
                0.18,
                5.8
            ),
            makeMaterial(
                PALETTE.dirtDark,
                {
                    roughness: 1
                }
            )
        );


    soil.position.y =
        0.08;

    soil.receiveShadow =
        true;


    farm.add(
        soil
    );


    for (
        let row = 0;
        row < 6;
        row += 1
    ) {

        const cropLine =
            new THREE.Group();


        for (
            let plant = 0;
            plant < 8;
            plant += 1
        ) {

            const stem =
                new THREE.Mesh(
                    new THREE.ConeGeometry(
                        0.18,
                        0.55,
                        5
                    ),
                    makeMaterial(
                        (
                            row +
                            plant
                        ) %
                        2
                            ? PALETTE.crop
                            : PALETTE.cropLight,
                        {
                            flatShading: true
                        }
                    )
                );


            stem.position.set(
                -3.0 +
                plant *
                0.84,
                0.37,
                -2.15 +
                row *
                0.86
            );

            stem.castShadow =
                true;


            cropLine.add(
                stem
            );

        }


        farm.add(
            cropLine
        );

    }


    return farm;

}


function createWell() {

    const well =
        new THREE.Group();


    well.position.set(
        0,
        0,
        1
    );


    /* ================================
       STONE RIM
    ================================ */

    const stoneCount = 18;

    const radius = 1.45;


    for (
        let index = 0;
        index < stoneCount;
        index += 1
    ) {

        const angle =
            (
                index /
                stoneCount
            ) *
            Math.PI *
            2;


        const stone =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    0.58,
                    0.42,
                    0.42
                ),
                makeMaterial(
                    index % 3 === 0
                        ? PALETTE.stoneDark
                        : PALETTE.stone,
                    {
                        roughness: 1
                    }
                )
            );


        stone.position.set(
            Math.cos(angle) *
                radius,

            0.35 +
                Math.sin(
                    index *
                    1.7
                ) *
                0.035,

            Math.sin(angle) *
                radius
        );


        stone.rotation.y =
            -angle;


        stone.rotation.z =
            randomBetween(
                -0.08,
                0.08
            );


        stone.scale.set(
            randomBetween(
                0.88,
                1.12
            ),

            randomBetween(
                0.9,
                1.15
            ),

            randomBetween(
                0.9,
                1.12
            )
        );


        stone.castShadow =
            true;

        stone.receiveShadow =
            true;


        well.add(
            stone
        );

    }


    /* ================================
       INNER DARK WALL
    ================================ */

    const innerWall =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                1.18,
                1.25,
                0.62,
                24,
                1,
                true
            ),
            makeMaterial(
                PALETTE.stoneDark,
                {
                    roughness: 1
                }
            )
        );


    innerWall.position.y =
        0.22;


    innerWall.castShadow =
        true;

    innerWall.receiveShadow =
        true;


    well.add(
        innerWall
    );


    /* ================================
       WATER
    ================================ */

    const waterMaterial =
        new THREE.MeshStandardMaterial({
            color:
                PALETTE.water,

            roughness:
                0.25,

            metalness:
                0.05,

            transparent:
                true,

            opacity:
                0.88
        });


    const water =
        new THREE.Mesh(
            new THREE.CircleGeometry(
                1.05,
                32
            ),
            waterMaterial
        );


    water.rotation.x =
        -Math.PI /
        2;


    water.position.y =
        0.08;


    well.add(
        water
    );


    /* subtle inner water highlight */

    const waterHighlight =
        new THREE.Mesh(
            new THREE.RingGeometry(
                0.78,
                1.02,
                32
            ),
            new THREE.MeshBasicMaterial({
                color:
                    0x6d989d,

                transparent:
                    true,

                opacity:
                    0.12,

                side:
                    THREE.DoubleSide
            })
        );


    waterHighlight.rotation.x =
        -Math.PI /
        2;


    waterHighlight.position.y =
        0.085;


    well.add(
        waterHighlight
    );


    /* ================================
       WOODEN POSTS
    ================================ */

    for (
        const x of [
            -1.65,
            1.65
        ]
    ) {

        const post =
            new THREE.Mesh(
                new THREE.CylinderGeometry(
                    0.12,
                    0.15,
                    2.7,
                    8
                ),
                makeMaterial(
                    PALETTE.timber
                )
            );


        post.position.set(
            x,
            1.45,
            0
        );


        post.castShadow =
            true;


        well.add(
            post
        );

    }


    /* ================================
       CROSS BEAM
    ================================ */

    const beam =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.11,
                0.11,
                3.6,
                8
            ),
            makeMaterial(
                PALETTE.timber
            )
        );


    beam.rotation.z =
        Math.PI /
        2;


    beam.position.set(
        0,
        2.55,
        0
    );


    beam.castShadow =
        true;


    well.add(
        beam
    );


    /* ================================
       ROPE / SHAFT
    ================================ */

    const rope =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.025,
                0.025,
                1.4,
                6
            ),
            makeMaterial(
                0x78654b
            )
        );


    rope.position.set(
        0,
        1.72,
        0
    );


    well.add(
        rope
    );


    /* ================================
       BUCKET
    ================================ */

    const bucket =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.18,
                0.22,
                0.34,
                10
            ),
            makeMaterial(
                PALETTE.timberDark
            )
        );


    bucket.position.set(
        0,
        0.92,
        0
    );


    bucket.castShadow =
        true;


    well.add(
        bucket
    );


    return well;

}


function createFenceSection(
    x,
    z,
    length,
    rotation = 0
) {

    const fence =
        new THREE.Group();


    fence.position.set(
        x,
        0,
        z
    );

    fence.rotation.y =
        rotation;


    const timber =
        makeMaterial(
            PALETTE.timber
        );


    const rail =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                length,
                0.16,
                0.16
            ),
            timber
        );


    rail.position.y =
        0.8;


    fence.add(
        rail
    );


    const posts =
        Math.max(
            2,
            Math.floor(
                length /
                1.5
            ) +
            1
        );


    for (
        let index = 0;
        index < posts;
        index += 1
    ) {

        const post =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    0.18,
                    1.45,
                    0.18
                ),
                timber
            );


        post.position.set(
            -length /
            2 +
            index *
            (
                length /
                (
                    posts -
                    1
                )
            ),
            0.72,
            0
        );


        fence.add(
            post
        );

    }


    setShadow(
        fence
    );


    return fence;

}


function createTree({
    x,
    z,
    scale
}) {

    const tree =
        new THREE.Group();


    tree.position.set(
        x,
        0,
        z
    );

    tree.scale.setScalar(
        scale
    );


    const trunk =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.22,
                0.32,
                2.2,
                8
            ),
            makeMaterial(
                0x4b3825,
                {
                    flatShading: true
                }
            )
        );


    trunk.position.y =
        1.1;


    const crownBottom =
        new THREE.Mesh(
            new THREE.IcosahedronGeometry(
                1.45,
                1
            ),
            makeMaterial(
                random() >
                0.5
                    ? 0x365d35
                    : 0x2c5131,
                {
                    flatShading: true
                }
            )
        );


    crownBottom.position.y =
        2.7;

    crownBottom.scale.y =
        0.88;


    const crownTop =
        new THREE.Mesh(
            new THREE.IcosahedronGeometry(
                1.05,
                1
            ),
            makeMaterial(
                random() >
                0.5
                    ? 0x4b7142
                    : 0x3e673a,
                {
                    flatShading: true
                }
            )
        );


    crownTop.position.set(
        0.2,
        3.65,
        -0.12
    );


    tree.add(
        trunk,
        crownBottom,
        crownTop
    );


    setShadow(
        tree,
        true,
        true
    );


    return tree;

}


function createRock(
    x,
    z,
    scale = 1
) {

    const rock =
        new THREE.Mesh(
            new THREE.DodecahedronGeometry(
                0.65,
                0
            ),
            makeMaterial(
                random() >
                0.5
                    ? PALETTE.stone
                    : PALETTE.stoneDark,
                {
                    flatShading: true
                }
            )
        );


    rock.position.set(
        x,
        0.42 *
        scale,
        z
    );

    rock.scale.set(
        scale,
        scale *
        randomBetween(
            0.58,
            0.9
        ),
        scale
    );

    rock.rotation.set(
        randomBetween(
            -0.2,
            0.2
        ),
        randomBetween(
            0,
            Math.PI
        ),
        randomBetween(
            -0.2,
            0.2
        )
    );


    rock.castShadow =
        true;

    rock.receiveShadow =
        true;


    return rock;

}


function createWilderness(
    scene
) {

    let treesCreated =
        0;

    let attempts =
        0;


    while (
        treesCreated <
        54 &&
        attempts <
        600
    ) {

        attempts += 1;


        const x =
            randomBetween(
                -35,
                35
            );

        const z =
            randomBetween(
                -25,
                25
            );


        const outer =
            Math.abs(
                x
            ) >
            20 ||
            Math.abs(
                z
            ) >
            15;


        if (!outer) {
            continue;
        }


        scene.add(
            createTree({
                x,
                z,
                scale:
                    randomBetween(
                        0.65,
                        1.25
                    )
            })
        );


        treesCreated +=
            1;

    }


    for (
        let index = 0;
        index < 22;
        index += 1
    ) {

        const x =
            randomBetween(
                -32,
                32
            );

        const z =
            randomBetween(
                -23,
                23
            );


        if (
            Math.abs(
                x
            ) <
            14 &&
            Math.abs(
                z
            ) <
            11
        ) {
            continue;
        }


        scene.add(
            createRock(
                x,
                z,
                randomBetween(
                    0.45,
                    1.0
                )
            )
        );

    }

}


function isInsideObstacle(
    x,
    z
) {

    const insideBuilding =
        BUILDING_OBSTACLES.some(
            (obstacle) => {

                return (
                    Math.abs(
                        x -
                        obstacle.x
                    ) <
                    obstacle.w /
                    2 +
                    0.8 &&
                    Math.abs(
                        z -
                        obstacle.z
                    ) <
                    obstacle.d /
                    2 +
                    0.8
                );

            }
        );


    if (insideBuilding) {
        return true;
    }


    return CIRCULAR_OBSTACLES.some(
        (obstacle) => {

            const dx =
                x -
                obstacle.x;

            const dz =
                z -
                obstacle.z;

            const safeRadius =
                obstacle.radius +
                0.55;


            return (
                dx * dx +
                dz * dz
            ) <
            safeRadius *
            safeRadius;

        }
    );

}


function navKey(
    col,
    row
) {

    return `${col},${row}`;

}


function worldToGrid(
    x,
    z
) {

    return {
        col:
            Math.round(
                (
                    x -
                    NAVIGATION.minX
                ) /
                NAVIGATION.cellSize
            ),

        row:
            Math.round(
                (
                    z -
                    NAVIGATION.minZ
                ) /
                NAVIGATION.cellSize
            )
    };

}


function gridToWorld(
    col,
    row
) {

    return new THREE.Vector3(
        NAVIGATION.minX +
            col *
            NAVIGATION.cellSize,
        0,
        NAVIGATION.minZ +
            row *
            NAVIGATION.cellSize
    );

}


function isInsideTownWalkArea(
    x,
    z
) {

    const nx =
        x /
        NAVIGATION.ellipseRadiusX;

    const nz =
        (
            z -
            0.6
        ) /
        NAVIGATION.ellipseRadiusZ;


    return (
        nx * nx +
        nz * nz
    ) <=
    1;

}


function isInsideBuildingNavigationBlock(
    x,
    z
) {

    return BUILDING_OBSTACLES.some(
        (obstacle) => {

            return (
                Math.abs(
                    x -
                    obstacle.x
                ) <=
                obstacle.w /
                2 +
                NAVIGATION.buildingMargin &&
                Math.abs(
                    z -
                    obstacle.z
                ) <=
                obstacle.d /
                2 +
                NAVIGATION.buildingMargin
            );

        }
    );

}


function isInsideCircularNavigationBlock(
    x,
    z
) {

    return CIRCULAR_OBSTACLES.some(
        (obstacle) => {

            const dx =
                x -
                obstacle.x;

            const dz =
                z -
                obstacle.z;

            const radius =
                obstacle.radius +
                NAVIGATION.wellMargin;


            return (
                dx * dx +
                dz * dz
            ) <=
            radius *
            radius;

        }
    );

}


function isNavigationPointWalkable(
    x,
    z
) {

    return (
        isInsideTownWalkArea(
            x,
            z
        ) &&
        !isInsideBuildingNavigationBlock(
            x,
            z
        ) &&
        !isInsideCircularNavigationBlock(
            x,
            z
        )
    );

}


function buildNavigationGrid() {

    const cols =
        Math.floor(
            (
                NAVIGATION.maxX -
                NAVIGATION.minX
            ) /
            NAVIGATION.cellSize
        ) +
        1;

    const rows =
        Math.floor(
            (
                NAVIGATION.maxZ -
                NAVIGATION.minZ
            ) /
            NAVIGATION.cellSize
        ) +
        1;


    const cells =
        new Map();

    const walkableCells =
        [];


    for (
        let row = 0;
        row < rows;
        row += 1
    ) {

        for (
            let col = 0;
            col < cols;
            col += 1
        ) {

            const world =
                gridToWorld(
                    col,
                    row
                );


            const walkable =
                isNavigationPointWalkable(
                    world.x,
                    world.z
                );


            const cell = {
                col,
                row,
                x: world.x,
                z: world.z,
                walkable
            };


            cells.set(
                navKey(
                    col,
                    row
                ),
                cell
            );


            if (walkable) {
                walkableCells.push(
                    cell
                );
            }

        }

    }


    NAV_GRID = {
        cols,
        rows,
        cells
    };


    WALKABLE_CELLS =
        walkableCells;

}


function getNavCell(
    col,
    row
) {

    if (!NAV_GRID) {
        return null;
    }


    return NAV_GRID.cells.get(
        navKey(
            col,
            row
        )
    ) ||
    null;

}


function findNearestWalkableCell(
    position
) {

    if (!NAV_GRID) {
        return null;
    }


    const start =
        worldToGrid(
            position.x,
            position.z
        );


    const direct =
        getNavCell(
            start.col,
            start.row
        );


    if (
        direct?.walkable
    ) {
        return direct;
    }


    for (
        let radius = 1;
        radius <= 8;
        radius += 1
    ) {

        let bestCell =
            null;

        let bestDistance =
            Infinity;


        for (
            let row =
                start.row -
                radius;
            row <=
                start.row +
                radius;
            row += 1
        ) {

            for (
                let col =
                    start.col -
                    radius;
                col <=
                    start.col +
                    radius;
                col += 1
            ) {

                if (
                    Math.abs(
                        col -
                        start.col
                    ) !==
                    radius &&
                    Math.abs(
                        row -
                        start.row
                    ) !==
                    radius
                ) {
                    continue;
                }


                const cell =
                    getNavCell(
                        col,
                        row
                    );


                if (
                    !cell?.walkable
                ) {
                    continue;
                }


                const dx =
                    position.x -
                    cell.x;

                const dz =
                    position.z -
                    cell.z;

                const distance =
                    dx * dx +
                    dz * dz;


                if (
                    distance <
                    bestDistance
                ) {

                    bestDistance =
                        distance;

                    bestCell =
                        cell;

                }

            }

        }


        if (bestCell) {
            return bestCell;
        }

    }


    return null;

}


function canMoveDiagonal(
    fromCol,
    fromRow,
    toCol,
    toRow
) {

    const dx =
        toCol -
        fromCol;

    const dz =
        toRow -
        fromRow;


    if (
        Math.abs(
            dx
        ) !==
        1 ||
        Math.abs(
            dz
        ) !==
        1
    ) {
        return true;
    }


    const horizontal =
        getNavCell(
            fromCol +
            dx,
            fromRow
        );

    const vertical =
        getNavCell(
            fromCol,
            fromRow +
            dz
        );


    return Boolean(
        horizontal?.walkable &&
        vertical?.walkable
    );

}


function getWalkableNeighbours(
    cell
) {

    const neighbours =
        [];


    const offsets = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],

        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1]
    ];


    offsets.forEach(
        (
            [
                dc,
                dr
            ]
        ) => {

            const neighbour =
                getNavCell(
                    cell.col +
                    dc,
                    cell.row +
                    dr
                );


            if (
                !neighbour?.walkable
            ) {
                return;
            }


            if (
                !canMoveDiagonal(
                    cell.col,
                    cell.row,
                    neighbour.col,
                    neighbour.row
                )
            ) {
                return;
            }


            neighbours.push(
                neighbour
            );

        }
    );


    return neighbours;

}


function heuristic(
    a,
    b
) {

    return Math.hypot(
        a.col -
        b.col,
        a.row -
        b.row
    );

}


function findGridPath(
    startCell,
    goalCell
) {

    if (
        !startCell ||
        !goalCell
    ) {
        return [];
    }


    if (
        startCell ===
        goalCell
    ) {
        return [
            startCell
        ];
    }


    const open =
        new Map();

    const cameFrom =
        new Map();

    const gScore =
        new Map();

    const fScore =
        new Map();


    const startKey =
        navKey(
            startCell.col,
            startCell.row
        );


    open.set(
        startKey,
        startCell
    );

    gScore.set(
        startKey,
        0
    );

    fScore.set(
        startKey,
        heuristic(
            startCell,
            goalCell
        )
    );


    while (
        open.size
    ) {

        let currentKey =
            null;

        let current =
            null;

        let lowestScore =
            Infinity;


        open.forEach(
            (
                cell,
                key
            ) => {

                const score =
                    fScore.get(
                        key
                    ) ??
                    Infinity;


                if (
                    score <
                    lowestScore
                ) {

                    lowestScore =
                        score;

                    currentKey =
                        key;

                    current =
                        cell;

                }

            }
        );


        if (!current) {
            break;
        }


        if (
            current.col ===
            goalCell.col &&
            current.row ===
            goalCell.row
        ) {

            const path = [
                current
            ];

            let cursorKey =
                currentKey;


            while (
                cameFrom.has(
                    cursorKey
                )
            ) {

                cursorKey =
                    cameFrom.get(
                        cursorKey
                    );


                const [
                    col,
                    row
                ] =
                    cursorKey
                        .split(",")
                        .map(Number);


                const cell =
                    getNavCell(
                        col,
                        row
                    );


                if (cell) {
                    path.push(
                        cell
                    );
                }

            }


            path.reverse();


            return path;

        }


        open.delete(
            currentKey
        );


        getWalkableNeighbours(
            current
        ).forEach(
            (neighbour) => {

                const neighbourKey =
                    navKey(
                        neighbour.col,
                        neighbour.row
                    );


                const diagonal =
                    neighbour.col !==
                    current.col &&
                    neighbour.row !==
                    current.row;


                const tentative =
                    (
                        gScore.get(
                            currentKey
                        ) ??
                        Infinity
                    ) +
                    (
                        diagonal
                            ? 1.414
                            : 1
                    );


                if (
                    tentative >=
                    (
                        gScore.get(
                            neighbourKey
                        ) ??
                        Infinity
                    )
                ) {
                    return;
                }


                cameFrom.set(
                    neighbourKey,
                    currentKey
                );


                gScore.set(
                    neighbourKey,
                    tentative
                );


                fScore.set(
                    neighbourKey,
                    tentative +
                    heuristic(
                        neighbour,
                        goalCell
                    )
                );


                open.set(
                    neighbourKey,
                    neighbour
                );

            }
        );

    }


    return [];

}


function simplifyGridPath(
    cells
) {

    if (
        cells.length <=
        2
    ) {
        return cells;
    }


    const simplified = [
        cells[0]
    ];


    let previousDirection =
        null;


    for (
        let index = 1;
        index <
        cells.length;
        index += 1
    ) {

        const previous =
            cells[
                index -
                1
            ];

        const current =
            cells[
                index
            ];


        const dc =
            Math.sign(
                current.col -
                previous.col
            );

        const dr =
            Math.sign(
                current.row -
                previous.row
            );


        const direction =
            `${dc},${dr}`;


        if (
            previousDirection !==
            null &&
            direction !==
            previousDirection
        ) {

            simplified.push(
                previous
            );

        }


        previousDirection =
            direction;

    }


    simplified.push(
        cells[
            cells.length -
            1
        ]
    );


    return simplified;

}


function chooseRandomWalkableCell(
    currentCell
) {

    if (
        !WALKABLE_CELLS.length
    ) {
        return currentCell;
    }


    let selected =
        currentCell;


    for (
        let attempt = 0;
        attempt < 50;
        attempt += 1
    ) {

        const candidate =
            randomChoice(
                WALKABLE_CELLS
            );


        if (
            !currentCell
        ) {
            return candidate;
        }


        const distance =
            Math.hypot(
                candidate.x -
                currentCell.x,
                candidate.z -
                currentCell.z
            );


        /*
         * Prefer meaningful journeys instead of
         * tiny one-cell shuffles.
         */

        if (
            distance >
            4.0
        ) {

            selected =
                candidate;

            break;

        }

    }


    return selected;
}


function makePathPoint(
    cell,
    laneSeed,
    isDestination = false
) {

    const lane =
        (
            laneSeed -
            0.5
        ) *
        (
            isDestination
                ? 0.38
                : 0.22
        );


    return new THREE.Vector3(
        cell.x +
            lane,
        0,
        cell.z -
            lane *
            0.5
    );

}


function assignNewVillagerRoute(
    villager
) {

    const data =
        villager.userData;


    const startCell =
        findNearestWalkableCell(
            villager.position
        );


    if (!startCell) {
        return;
    }


    const destination =
        chooseRandomWalkableCell(
            startCell
        );


    const rawPath =
        findGridPath(
            startCell,
            destination
        );


    if (
        rawPath.length <
        2
    ) {

        data.pathPoints = [
            makePathPoint(
                startCell,
                data.laneSeed
            )
        ];

        data.pathIndex = 0;

        data.target =
            data.pathPoints[0];

        return;
    }


    const path =
        simplifyGridPath(
            rawPath
        );


    data.pathPoints =
        path
            .slice(1)
            .map(
                (
                    cell,
                    index
                ) => {

                    return makePathPoint(
                        cell,
                        data.laneSeed,
                        index ===
                        path.length -
                        2
                    );

                }
            );


    data.pathIndex =
        0;


    data.target =
        data.pathPoints[0];


    data.stuckTime =
        0;

    data.lastXZ =
        new THREE.Vector2(
            villager.position.x,
            villager.position.z
        );

}


function snapVillagerToNavigation(
    villager
) {

    const nearest =
        findNearestWalkableCell(
            villager.position
        );


    if (!nearest) {
        return;
    }


    villager.position.x =
        nearest.x;

    villager.position.z =
        nearest.z;


    assignNewVillagerRoute(
        villager
    );

}


function createHairStyle(
    category,
    headRadius,
    hairMaterial
) {

    const hairGroup =
        new THREE.Group();


    const maleStyles = [
        "short",
        "side",
        "crop"
    ];

    const femaleStyles = [
        "bob",
        "long",
        "bun"
    ];

    const childStyles = [
        "short",
        "bob",
        "crop",
        "side"
    ];


    const style =
        randomChoice(
            category === "male"
                ? maleStyles
                : category === "female"
                  ? femaleStyles
                  : childStyles
        );


    const cap =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                headRadius * 1.045,
                12,
                8,
                0,
                Math.PI * 2,
                0,
                Math.PI / 2
            ),
            hairMaterial
        );


    cap.position.y =
        headRadius * 0.31;


    hairGroup.add(cap);


    if (style === "side") {

        const sideHair =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    headRadius * 0.42,
                    headRadius * 0.85,
                    headRadius * 1.15
                ),
                hairMaterial
            );


        sideHair.position.set(
            -headRadius * 0.72,
            -headRadius * 0.02,
            0
        );


        hairGroup.add(sideHair);
    }


    if (style === "crop") {

        cap.scale.set(
            1.0,
            0.72,
            1.0
        );

        cap.position.y =
            headRadius * 0.42;
    }


    if (style === "bob") {

        const back =
            new THREE.Mesh(
                new THREE.SphereGeometry(
                    headRadius * 1.04,
                    12,
                    8
                ),
                hairMaterial
            );


        back.scale.set(
            0.96,
            1.08,
            0.84
        );

        back.position.set(
            0,
            -headRadius * 0.16,
            -headRadius * 0.28
        );


        hairGroup.add(back);
    }


    if (style === "long") {

        const backHair =
            new THREE.Mesh(
                new THREE.CapsuleGeometry(
                    headRadius * 0.66,
                    headRadius * 1.4,
                    4,
                    8
                ),
                hairMaterial
            );


        backHair.scale.set(
            1.1,
            1.0,
            0.68
        );

        backHair.position.set(
            0,
            -headRadius * 1.06,
            -headRadius * 0.39
        );


        hairGroup.add(backHair);
    }


    if (style === "bun") {

        const bun =
            new THREE.Mesh(
                new THREE.SphereGeometry(
                    headRadius * 0.46,
                    10,
                    7
                ),
                hairMaterial
            );


        bun.position.set(
            0,
            headRadius * 0.82,
            -headRadius * 0.48
        );


        hairGroup.add(bun);
    }


    hairGroup.userData.style =
        style;


    return hairGroup;
}


function createVillager(
    id,
    category
) {

    const group =
        new THREE.Group();


    const spawnCell =
        randomChoice(
            WALKABLE_CELLS
        );


    const child =
        category === "child";


    const bodyScale =
        child
            ? 0.72
            : 1;


    const skin =
        makeMaterial(
            PALETTE.skin
        );

    const hair =
        makeMaterial(
            category === "female"
                ? 0x3f2d28
                : category === "male"
                  ? 0x251d19
                  : 0x37271f
        );


    const clothColor =
        category === "male"
            ? PALETTE.maleCloth
            : category === "female"
              ? PALETTE.femaleCloth
              : PALETTE.childCloth;


    const cloth =
        makeMaterial(
            clothColor
        );

    const trouserMaterial =
        makeMaterial(
            category === "female"
                ? 0x4f3d4d
                : 0x383331
        );

    const bootMaterial =
        makeMaterial(
            0x211d1a
        );


    const torso =
        new THREE.Mesh(
            category === "female"
                ? new THREE.CylinderGeometry(
                    0.36 * bodyScale,
                    0.52 * bodyScale,
                    1.05 * bodyScale,
                    9
                )
                : new THREE.CapsuleGeometry(
                    0.31 * bodyScale,
                    0.52 * bodyScale,
                    4,
                    8
                ),
            cloth
        );


    torso.position.y =
        1.34 * bodyScale;


    group.add(torso);


    if (category === "female") {

        const skirt =
            new THREE.Mesh(
                new THREE.CylinderGeometry(
                    0.44 * bodyScale,
                    0.60 * bodyScale,
                    0.72 * bodyScale,
                    10
                ),
                cloth
            );


        skirt.position.y =
            0.76 * bodyScale;


        group.add(skirt);
    }


    const neck =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.12 * bodyScale,
                0.13 * bodyScale,
                0.18 * bodyScale,
                8
            ),
            skin
        );


    neck.position.y =
        1.95 * bodyScale;


    group.add(neck);


    const headRadius =
        0.30 * bodyScale;


    const head =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                headRadius,
                14,
                10
            ),
            skin
        );


    head.position.y =
        2.22 * bodyScale;


    group.add(head);


    const hairStyle =
        createHairStyle(
            category,
            headRadius,
            hair
        );


    hairStyle.position.y =
        2.22 * bodyScale;


    group.add(hairStyle);


    const nose =
        new THREE.Mesh(
            new THREE.ConeGeometry(
                0.055 * bodyScale,
                0.13 * bodyScale,
                6
            ),
            skin
        );


    nose.rotation.x =
        Math.PI / 2;

    nose.position.set(
        0,
        2.20 * bodyScale,
        0.30 * bodyScale
    );


    group.add(nose);


    const legPivots = [];


    for (
        const side of [
            -1,
            1
        ]
    ) {

        const legPivot =
            new THREE.Group();


        legPivot.position.set(
            0.16 * side * bodyScale,
            0.66 * bodyScale,
            0
        );


        const leg =
            new THREE.Mesh(
                new THREE.CylinderGeometry(
                    0.085 * bodyScale,
                    0.095 * bodyScale,
                    0.64 * bodyScale,
                    7
                ),
                trouserMaterial
            );


        leg.position.y =
            -0.31 * bodyScale;


        const boot =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    0.18 * bodyScale,
                    0.18 * bodyScale,
                    0.30 * bodyScale
                ),
                bootMaterial
            );


        boot.position.set(
            0,
            -0.65 * bodyScale,
            0.07 * bodyScale
        );


        legPivot.add(
            leg,
            boot
        );


        group.add(
            legPivot
        );


        legPivots.push(
            legPivot
        );
    }


    const armPivots = [];


    for (
        const side of [
            -1,
            1
        ]
    ) {

        const armPivot =
            new THREE.Group();


        armPivot.position.set(
            0.41 * side * bodyScale,
            1.58 * bodyScale,
            0
        );


        const arm =
            new THREE.Mesh(
                new THREE.CylinderGeometry(
                    0.07 * bodyScale,
                    0.075 * bodyScale,
                    0.63 * bodyScale,
                    7
                ),
                cloth
            );


        arm.position.y =
            -0.29 * bodyScale;


        const hand =
            new THREE.Mesh(
                new THREE.SphereGeometry(
                    0.09 * bodyScale,
                    8,
                    6
                ),
                skin
            );


        hand.position.y =
            -0.64 * bodyScale;


        armPivot.rotation.z =
            side * 0.10;


        armPivot.add(
            arm,
            hand
        );


        group.add(
            armPivot
        );


        armPivots.push(
            armPivot
        );
    }


    group.userData = {
        id,
        category,

        speed:
            child
                ? randomBetween(
                    1.15,
                    1.5
                )
                : randomBetween(
                    0.8,
                    1.15
                ),

        phase:
            randomBetween(
                0,
                Math.PI * 2
            ),

        laneSeed:
            random(),

        pathPoints: [],
        pathIndex: 0,
        target: null,

        stuckTime: 0,
        lastXZ:
            new THREE.Vector2(),

        leftLeg:
            legPivots[0],

        rightLeg:
            legPivots[1],

        leftArm:
            armPivots[0],

        rightArm:
            armPivots[1],

        hairStyle:
            hairStyle.userData.style,

        walkIntensity: 0
    };


    group.scale.setScalar(
        child
            ? 0.92
            : 1
    );


    group.position.set(
        spawnCell.x,
        0,
        spawnCell.z
    );


    assignNewVillagerRoute(
        group
    );


    setShadow(
        group,
        true,
        true
    );


    return group;
}


function createVillagers(
    scene
) {

    const categories = [
        "male",
        "female",
        "male",
        "child",
        "female",
        "male",
        "female",
        "child",
        "female",
        "male"
    ];


    const villagers =
        categories.map(
            (
                category,
                index
            ) => {

                const villager =
                    createVillager(
                        `villager-${index + 1}`,
                        category
                    );


                scene.add(
                    villager
                );


                return villager;

            }
        );


    return villagers;

}


function keepOutsideBuildingObstacles(
    position
) {

    BUILDING_OBSTACLES.forEach(
        (obstacle) => {

            const margin =
                0.6;

            const minX =
                obstacle.x -
                obstacle.w / 2 -
                margin;

            const maxX =
                obstacle.x +
                obstacle.w / 2 +
                margin;

            const minZ =
                obstacle.z -
                obstacle.d / 2 -
                margin;

            const maxZ =
                obstacle.z +
                obstacle.d / 2 +
                margin;


            const inside =
                position.x >
                    minX &&
                position.x <
                    maxX &&
                position.z >
                    minZ &&
                position.z <
                    maxZ;


            if (!inside) {
                return;
            }


            const leftDist =
                position.x -
                minX;

            const rightDist =
                maxX -
                position.x;

            const topDist =
                position.z -
                minZ;

            const bottomDist =
                maxZ -
                position.z;


            const nearest =
                Math.min(
                    leftDist,
                    rightDist,
                    topDist,
                    bottomDist
                );


            if (
                nearest ===
                leftDist
            ) {

                position.x =
                    minX;

            } else if (
                nearest ===
                rightDist
            ) {

                position.x =
                    maxX;

            } else if (
                nearest ===
                topDist
            ) {

                position.z =
                    minZ;

            } else {

                position.z =
                    maxZ;

            }

        }
    );

}


function keepOutsideCircularObstacles(
    position
) {

    CIRCULAR_OBSTACLES.forEach(
        (obstacle) => {

            const dx =
                position.x -
                obstacle.x;

            const dz =
                position.z -
                obstacle.z;

            const safeRadius =
                obstacle.radius +
                0.5;

            const distanceSquared =
                dx * dx +
                dz * dz;


            if (
                distanceSquared >=
                safeRadius *
                safeRadius
            ) {
                return;
            }


            const distance =
                Math.max(
                    Math.sqrt(
                        distanceSquared
                    ),
                    0.001
                );

            const nx =
                dx /
                distance;

            const nz =
                dz /
                distance;


            position.x =
                obstacle.x +
                nx *
                safeRadius;

            position.z =
                obstacle.z +
                nz *
                safeRadius;

        }
    );

}


function updateVillagers(
    villagers,
    delta,
    elapsed
) {

    villagers.forEach(
        (villager) => {

            const data =
                villager.userData;


            if (
                !data.target ||
                !data.pathPoints?.length
            ) {

                assignNewVillagerRoute(
                    villager
                );

            }


            if (!data.target) {
                return;
            }


            const toTarget =
                new THREE.Vector3()
                    .subVectors(
                        data.target,
                        villager.position
                    );


            const distance =
                Math.hypot(
                    toTarget.x,
                    toTarget.z
                );


            if (
                distance <
                0.28
            ) {

                data.pathIndex +=
                    1;


                if (
                    data.pathIndex >=
                    data.pathPoints.length
                ) {

                    assignNewVillagerRoute(
                        villager
                    );

                } else {

                    data.target =
                        data.pathPoints[
                            data.pathIndex
                        ];

                }


                return;
            }


            toTarget.y = 0;

            toTarget.normalize();


            const step =
                data.speed *
                delta;


            villager.position.x +=
                toTarget.x *
                step;

            villager.position.z +=
                toTarget.z *
                step;


            /*
             * Collision is only an emergency safety net.
             * The A* route itself should already avoid assets.
             */

            keepOutsideBuildingObstacles(
                villager.position
            );


            keepOutsideCircularObstacles(
                villager.position
            );


            villager.rotation.y =
                Math.atan2(
                    toTarget.x,
                    toTarget.z
                );


            const walkCycle =
                elapsed *
                (
                    6.2 +
                    data.speed *
                    1.6
                ) +
                data.phase;


            data.walkIntensity +=
                (
                    1 -
                    data.walkIntensity
                ) *
                Math.min(
                    1,
                    delta *
                    9
                );


            const legSwing =
                Math.sin(
                    walkCycle
                ) *
                0.48 *
                data.walkIntensity;

            const armSwing =
                Math.sin(
                    walkCycle
                ) *
                0.34 *
                data.walkIntensity;


            if (
                data.leftLeg &&
                data.rightLeg
            ) {

                data.leftLeg.rotation.x =
                    legSwing;

                data.rightLeg.rotation.x =
                    -legSwing;
            }


            if (
                data.leftArm &&
                data.rightArm
            ) {

                data.leftArm.rotation.x =
                    -armSwing;

                data.rightArm.rotation.x =
                    armSwing;
            }


            /*
             * Stuck watchdog.
             *
             * If a villager barely changes X/Z for more than
             * 1.25 seconds, move them to the nearest valid
             * navigation cell and calculate a completely new
             * route. This prevents permanent edge-locking.
             */

            const currentXZ =
                new THREE.Vector2(
                    villager.position.x,
                    villager.position.z
                );


            const moved =
                currentXZ.distanceTo(
                    data.lastXZ
                );


            if (
                moved <
                0.008
            ) {

                data.stuckTime +=
                    delta;

            } else {

                data.stuckTime =
                    Math.max(
                        0,
                        data.stuckTime -
                        delta *
                        2
                    );

                data.lastXZ.copy(
                    currentXZ
                );

            }


            if (
                data.stuckTime >
                1.25
            ) {

                snapVillagerToNavigation(
                    villager
                );

                return;
            }


            villager.position.y =
                Math.abs(
                    Math.sin(
                        walkCycle * 2
                    )
                ) *
                0.018 *
                data.walkIntensity;

        }
    );

}


function countVillagers(
    villagers
) {

    return villagers.reduce(
        (
            counts,
            villager
        ) => {

            const category =
                villager.userData.category;


            counts[
                category
            ] += 1;


            return counts;

        },
        {
            male: 0,
            female: 0,
            child: 0
        }
    );

}


function addTownObjects(
    scene
) {

    addTownPaths(
        scene
    );


    [
        {
            x: -7.5,
            z: -4.5,
            rotation: 0.08,
            scale: 1.0
        },
        {
            x: 7.0,
            z: -5.0,
            rotation: -0.12,
            scale: 1.08,
            roofColor:
                PALETTE.roofDark
        },
        {
            x: -7.0,
            z: 6.3,
            rotation: -0.10,
            scale: 0.92
        },
        {
            x: 7.4,
            z: 6.4,
            rotation: 0.10,
            scale: 0.94
        }
    ].forEach(
        (config) => {

            scene.add(
                createHut(
                    config
                )
            );

        }
    );


    scene.add(
        createFarm()
    );

    scene.add(
        createWell()
    );


    scene.add(
        createFenceSection(
            16.0,
            2.6,
            7.0,
            Math.PI /
            2
        )
    );

    scene.add(
        createFenceSection(
            10.5,
            10.6,
            8.0,
            0.05
        )
    );

    scene.add(
        createFenceSection(
            -14.5,
            9.0,
            6.0,
            0.2
        )
    );

}


function createLights(
    scene
) {

    const hemisphere =
        new THREE.HemisphereLight(
            0xcad7c1,
            0x293024,
            1.85
        );


    scene.add(
        hemisphere
    );


    const sun =
        new THREE.DirectionalLight(
            0xffe4bf,
            3.0
        );


    sun.position.set(
        -18,
        28,
        12
    );

    sun.castShadow =
        true;


    sun.shadow.mapSize.set(
        2048,
        2048
    );


    sun.shadow.camera.left =
        -32;

    sun.shadow.camera.right =
        32;

    sun.shadow.camera.top =
        28;

    sun.shadow.camera.bottom =
        -28;

    sun.shadow.camera.near =
        1;

    sun.shadow.camera.far =
        70;

    sun.shadow.bias =
        -0.0004;


    scene.add(
        sun
    );

}


export function createTownScene(
    mount
) {

    if (!mount) {
        throw new Error(
            "Town mount element was not found."
        );
    }


    const scene =
        new THREE.Scene();


    scene.background =
        new THREE.Color(
            0x314d2d
        );


    scene.fog =
        new THREE.Fog(
            0x314d2d,
            46,
            78
        );


    const renderer =
        new THREE.WebGLRenderer({
            antialias: true,
            powerPreference:
                "high-performance"
        });


    renderer.setPixelRatio(
        Math.min(
            window.devicePixelRatio ||
            1,
            1.7
        )
    );


    renderer.outputColorSpace =
        THREE.SRGBColorSpace;


    renderer.toneMapping =
        THREE.ACESFilmicToneMapping;

    renderer.toneMappingExposure =
        1.08;


    renderer.shadowMap.enabled =
        true;

    renderer.shadowMap.type =
        THREE.PCFSoftShadowMap;


    renderer.domElement.setAttribute(
        "aria-hidden",
        "true"
    );


    mount.appendChild(
        renderer.domElement
    );


    const camera =
        new THREE.OrthographicCamera(
            -20,
            20,
            14,
            -14,
            0.1,
            120
        );


    camera.position.set(
        24,
        31,
        27
    );


    camera.lookAt(
        0,
        0,
        1
    );


    scene.add(
        createGround()
    );


    addTownObjects(
        scene
    );


    createWilderness(
        scene
    );


    createLights(
        scene
    );


    buildNavigationGrid();


    const villagers =
        createVillagers(
            scene
        );


    const counts =
        countVillagers(
            villagers
        );


    const clock =
        new THREE.Clock();


    let animationFrame =
        0;


    const reducedMotion =
        window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        );


    function resize() {

        const width =
            Math.max(
                1,
                mount.clientWidth
            );

        const height =
            Math.max(
                1,
                mount.clientHeight
            );


        renderer.setSize(
            width,
            height,
            false
        );


        const aspect =
            width /
            height;


        const viewHeight =
            aspect <
            0.9
                ? 37
                : aspect <
                  1.35
                    ? 32
                    : 28;


        camera.top =
            viewHeight /
            2;

        camera.bottom =
            -viewHeight /
            2;

        camera.right =
            camera.top *
            aspect;

        camera.left =
            -camera.right;


        camera.updateProjectionMatrix();

    }


    function renderFrame() {

        const delta =
            Math.min(
                clock.getDelta(),
                0.04
            );

        const elapsed =
            clock.elapsedTime;


        if (
            !reducedMotion.matches
        ) {

            updateVillagers(
                villagers,
                delta,
                elapsed
            );

        }


        renderer.render(
            scene,
            camera
        );


        animationFrame =
            window.requestAnimationFrame(
                renderFrame
            );

    }


    const resizeObserver =
        new ResizeObserver(
            resize
        );


    resizeObserver.observe(
        mount
    );


    resize();
    renderFrame();


    return {
        counts,
        villagers,

        destroy() {

            window.cancelAnimationFrame(
                animationFrame
            );

            resizeObserver.disconnect();

            renderer.dispose();

            renderer.domElement.remove();

        }
    };

}
