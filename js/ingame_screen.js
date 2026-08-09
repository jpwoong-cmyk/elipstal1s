(() => {

    const world =
        document.getElementById(
            "gameWorld"
        );

    const wilderness =
        document.getElementById(
            "wildernessLayer"
        );

    const fieldMessage =
        document.getElementById(
            "fieldMessage"
        );


    if (
        !world ||
        !wilderness
    ) {
        return;
    }


    /*
     * V1 state shape.
     *
     * Later these values can come directly
     * from Supabase without changing the HUD.
     */

    const gameState = {
        townHealth: 100,
        food: 0,
        coin: 0,
        villagers: "— / — / —"
    };


    window.EcliptalisIngameState =
        gameState;


    function renderHud() {

        const health =
            document.getElementById(
                "townHealthValue"
            );

        const food =
            document.getElementById(
                "foodValue"
            );

        const coin =
            document.getElementById(
                "coinValue"
            );

        const villagers =
            document.getElementById(
                "villagersValue"
            );


        if (health) {
            health.textContent =
                `${gameState.townHealth}%`;
        }


        if (food) {
            food.textContent =
                gameState.food;
        }


        if (coin) {
            coin.textContent =
                gameState.coin;
        }


        if (villagers) {
            villagers.textContent =
                gameState.villagers;
        }

    }


    /*
     * Deterministic pseudo-random generator.
     * The wilderness remains visually stable
     * between refreshes in V1.
     */

    function mulberry32(seed) {

        return function () {

            let value =
                seed +=
                0x6D2B79F5;

            value =
                Math.imul(
                    value ^
                    value >>> 15,
                    value | 1
                );

            value ^=
                value +
                Math.imul(
                    value ^
                    value >>> 7,
                    value | 61
                );

            return (
                (
                    value ^
                    value >>> 14
                ) >>>
                0
            ) /
            4294967296;

        };

    }


    const random =
        mulberry32(
            0xEC1A17
        );


    function randomBetween(
        min,
        max
    ) {

        return (
            min +
            random() *
            (
                max -
                min
            )
        );

    }


    function isTownClearing(
        x,
        y
    ) {

        const dx =
            (
                x -
                50
            ) /
            24;

        const dy =
            (
                y -
                47
            ) /
            31;


        return (
            dx * dx +
            dy * dy
        ) < 1;

    }


    function isOuterWilderness(
        x,
        y
    ) {

        return (
            x < 22 ||
            x > 78 ||
            y < 13 ||
            y > 83
        );

    }


    function createTree(
        x,
        y,
        scale
    ) {

        const tree =
            document.createElement(
                "span"
            );

        tree.className =
            "wild-tree";

        tree.style.setProperty(
            "--tree-x",
            x.toFixed(2)
        );

        tree.style.setProperty(
            "--tree-y",
            y.toFixed(2)
        );

        tree.style.setProperty(
            "--tree-scale",
            scale.toFixed(2)
        );

        wilderness.appendChild(tree);

    }


    function createGrass(
        x,
        y
    ) {

        const grass =
            document.createElement(
                "span"
            );

        grass.className =
            "grass-tuft";

        grass.style.setProperty(
            "--grass-x",
            x.toFixed(2)
        );

        grass.style.setProperty(
            "--grass-y",
            y.toFixed(2)
        );

        grass.style.setProperty(
            "--grass-opacity",
            randomBetween(
                0.25,
                0.62
            ).toFixed(2)
        );

        grass.style.setProperty(
            "--grass-rotate",
            randomBetween(
                -40,
                40
            ).toFixed(1)
        );

        wilderness.appendChild(grass);

    }


    function createStone(
        x,
        y
    ) {

        const stone =
            document.createElement(
                "span"
            );

        stone.className =
            "wild-stone";

        stone.style.setProperty(
            "--stone-x",
            x.toFixed(2)
        );

        stone.style.setProperty(
            "--stone-y",
            y.toFixed(2)
        );

        stone.style.setProperty(
            "--stone-rotate",
            randomBetween(
                -45,
                45
            ).toFixed(1)
        );

        wilderness.appendChild(stone);

    }


    function buildWilderness() {

        wilderness.replaceChildren();


        /*
         * Perimeter trees.
         */

        let treesCreated = 0;
        let treeAttempts = 0;


        while (
            treesCreated < 48 &&
            treeAttempts < 500
        ) {

            treeAttempts += 1;


            const x =
                randomBetween(
                    2,
                    98
                );

            const y =
                randomBetween(
                    3,
                    97
                );


            if (
                !isOuterWilderness(
                    x,
                    y
                )
            ) {
                continue;
            }


            createTree(
                x,
                y,
                randomBetween(
                    0.62,
                    1.28
                )
            );

            treesCreated += 1;

        }


        /*
         * Grass inside and outside the defence ring.
         */

        for (
            let index = 0;
            index < 58;
            index += 1
        ) {

            const x =
                randomBetween(
                    3,
                    97
                );

            const y =
                randomBetween(
                    5,
                    95
                );


            if (
                isTownClearing(
                    x,
                    y
                )
            ) {
                continue;
            }


            createGrass(
                x,
                y
            );

        }


        /*
         * A few stones give the ground
         * more visual weight.
         */

        for (
            let index = 0;
            index < 15;
            index += 1
        ) {

            let x;
            let y;


            do {

                x =
                    randomBetween(
                        4,
                        96
                    );

                y =
                    randomBetween(
                        6,
                        94
                    );

            } while (
                isTownClearing(
                    x,
                    y
                )
            );


            createStone(
                x,
                y
            );

        }

    }


    let messageTimer = null;


    function showFieldMessage(
        message
    ) {

        if (!fieldMessage) return;


        fieldMessage.textContent =
            message;

        fieldMessage.classList.add(
            "is-visible"
        );


        window.clearTimeout(
            messageTimer
        );


        messageTimer =
            window.setTimeout(
                () => {

                    fieldMessage.classList.remove(
                        "is-visible"
                    );

                },
                2600
            );

    }


    function selectDeploymentSlot(
        slot
    ) {

        document
            .querySelectorAll(
                ".deploy-slot"
            )
            .forEach(
                (button) => {

                    button.classList.remove(
                        "is-selected"
                    );

                }
            );


        slot.classList.add(
            "is-selected"
        );


        const slotId =
            slot.dataset.slotId;

        const cardId =
            slot.dataset.cardId;


        if (!cardId) {

            showFieldMessage(
                `${slotId} awaits a card.`
            );

            return;
        }


        showFieldMessage(
            `${slotId} holds card ${cardId}.`
        );

    }


    document.addEventListener(
        "click",
        (event) => {

            const deploySlot =
                event.target.closest(
                    ".deploy-slot"
                );


            if (deploySlot) {

                selectDeploymentSlot(
                    deploySlot
                );

                return;
            }


            const action =
                event.target.closest(
                    "[data-game-action]"
                );


            if (!action) return;


            switch (
                action.dataset.gameAction
            ) {

                case "booster":

                    showFieldMessage(
                        "Booster Hall is not open in V1."
                    );

                    break;


                case "deck":

                    showFieldMessage(
                        "Your deck will appear here once cards are connected."
                    );

                    break;


                case "settings":

                    showFieldMessage(
                        "Battle Settings are not yet bound to this screen."
                    );

                    break;


                case "save-exit":

                    window.location.href =
                        "index.html";

                    break;

            }

        }
    );


    renderHud();
    buildWilderness();

})();
