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
    { x: 13.0, z: 7.2, w: 7.5, d: 6.0 },
    { x: 0.0, z: 1.0, w: 3.0, d: 3.0 }
];


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
        -0.56;

    roofLeft.position.set(
        -1.22,
        3.22,
        0
    );


    const roofRight =
        roofLeft.clone();

    roofRight.rotation.z =
        0.56;

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


    const ring =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                1.35,
                1.45,
                0.65,
                16,
                1,
                true
            ),
            makeMaterial(
                PALETTE.stone
            )
        );


    ring.position.y =
        0.36;

    ring.castShadow =
        true;

    ring.receiveShadow =
        true;


    well.add(
        ring
    );


    const water =
        new THREE.Mesh(
            new THREE.CircleGeometry(
                1.12,
                20
            ),
            makeMaterial(
                PALETTE.water,
                {
                    roughness: 0.45
                }
            )
        );


    water.rotation.x =
        -Math.PI /
        2;

    water.position.y =
        0.27;


    well.add(
        water
    );


    for (
        const x of [
            -1.3,
            1.3
        ]
    ) {

        const post =
            new THREE.Mesh(
                new THREE.CylinderGeometry(
                    0.11,
                    0.13,
                    2.5,
                    8
                ),
                makeMaterial(
                    PALETTE.timber
                )
            );


        post.position.set(
            x,
            1.55,
            0
        );

        post.castShadow =
            true;


        well.add(
            post
        );

    }


    const beam =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.10,
                0.10,
                3.0,
                8
            ),
            makeMaterial(
                PALETTE.timber
            )
        );


    beam.rotation.z =
        Math.PI /
        2;

    beam.position.y =
        2.45;

    beam.castShadow =
        true;


    well.add(
        beam
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

    return BUILDING_OBSTACLES.some(
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

}


function chooseVillagerTarget() {

    for (
        let attempt = 0;
        attempt < 60;
        attempt += 1
    ) {

        const angle =
            randomBetween(
                0,
                Math.PI *
                2
            );

        const radius =
            Math.sqrt(
                random()
            ) *
            13.5;


        const x =
            Math.cos(
                angle
            ) *
            radius;

        const z =
            Math.sin(
                angle
            ) *
            radius;


        if (
            !isInsideObstacle(
                x,
                z
            )
        ) {

            return new THREE.Vector3(
                x,
                0,
                z
            );

        }

    }


    return new THREE.Vector3(
        0,
        0,
        10
    );

}


function createVillager(
    id,
    category
) {

    const group =
        new THREE.Group();


    group.userData = {
        id,
        category,
        target:
            chooseVillagerTarget(),
        speed:
            category ===
            "child"
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
                Math.PI *
                2
            )
    };


    const child =
        category ===
        "child";


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
            PALETTE.hair
        );


    const clothColor =
        category ===
        "male"
            ? PALETTE.maleCloth
            : category ===
              "female"
                ? PALETTE.femaleCloth
                : PALETTE.childCloth;


    const cloth =
        makeMaterial(
            clothColor
        );


    const torsoGeometry =
        category ===
        "female"
            ? new THREE.ConeGeometry(
                0.42,
                1.2,
                9
            )
            : new THREE.CapsuleGeometry(
                0.34,
                0.62,
                4,
                8
            );


    const torso =
        new THREE.Mesh(
            torsoGeometry,
            cloth
        );


    torso.position.y =
        1.24 *
        bodyScale;

    torso.scale.setScalar(
        bodyScale
    );


    if (
        category ===
        "female"
    ) {
        torso.position.y =
            1.18;
    }


    const head =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.32 *
                bodyScale,
                12,
                8
            ),
            skin
        );


    head.position.y =
        2.18 *
        bodyScale;


    const hairCap =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.335 *
                bodyScale,
                12,
                8,
                0,
                Math.PI *
                2,
                0,
                Math.PI /
                2.0
            ),
            hair
        );


    hairCap.position.y =
        2.29 *
        bodyScale;


    group.add(
        torso,
        head,
        hairCap
    );


    const limbMaterial =
        cloth;


    for (
        const side of [
            -1,
            1
        ]
    ) {

        const leg =
            new THREE.Mesh(
                new THREE.CylinderGeometry(
                    0.09 *
                    bodyScale,
                    0.095 *
                    bodyScale,
                    0.78 *
                    bodyScale,
                    7
                ),
                makeMaterial(
                    0x352f2c
                )
            );


        leg.position.set(
            0.16 *
            side *
            bodyScale,
            0.42 *
            bodyScale,
            0
        );


        group.add(
            leg
        );


        const arm =
            new THREE.Mesh(
                new THREE.CylinderGeometry(
                    0.075 *
                    bodyScale,
                    0.075 *
                    bodyScale,
                    0.74 *
                    bodyScale,
                    7
                ),
                limbMaterial
            );


        arm.position.set(
            0.43 *
            side *
            bodyScale,
            1.35 *
            bodyScale,
            0
        );

        arm.rotation.z =
            side *
            0.15;


        group.add(
            arm
        );

    }


    group.scale.setScalar(
        child
            ? 0.9
            : 1
    );


    group.position.copy(
        chooseVillagerTarget()
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


function updateVillagers(
    villagers,
    delta,
    elapsed
) {

    villagers.forEach(
        (villager) => {

            const data =
                villager.userData;


            const toTarget =
                new THREE.Vector3()
                    .subVectors(
                        data.target,
                        villager.position
                    );


            const distance =
                toTarget.length();


            if (
                distance <
                0.45
            ) {

                data.target =
                    chooseVillagerTarget();

                return;
            }


            toTarget.normalize();


            villager.position.addScaledVector(
                toTarget,
                data.speed *
                delta
            );


            villager.rotation.y =
                Math.atan2(
                    toTarget.x,
                    toTarget.z
                );


            /*
             * A tiny walking bob keeps the civilians
             * alive without needing external animations.
             */

            villager.position.y =
                Math.abs(
                    Math.sin(
                        elapsed *
                        6 *
                        data.speed +
                        data.phase
                    )
                ) *
                0.035;

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
