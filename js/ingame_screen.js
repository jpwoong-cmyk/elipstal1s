import {
    createTownScene
} from "./ingame_town.js";


const world =
    document.getElementById(
        "gameWorld"
    );

const townMount =
    document.getElementById(
        "threeTownMount"
    );

const townLoading =
    document.getElementById(
        "townLoading"
    );

const fieldMessage =
    document.getElementById(
        "fieldMessage"
    );


if (
    !world ||
    !townMount
) {
    throw new Error(
        "The in-game screen could not find its required DOM elements."
    );
}


/*
 * V2 UI state.
 *
 * Town villagers are counted from the
 * actual Three.js villager objects.
 */

const gameState = {
    townHealth: 100,
    food: 0,
    coin: 0,

    villagers: {
        male: 0,
        female: 0,
        child: 0
    }
};


window.EcliptalisIngameState =
    gameState;


function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {
        element.textContent =
            value;
    }

}


function renderHud() {

    setText(
        "townHealthValue",
        `${gameState.townHealth}%`
    );

    setText(
        "foodValue",
        gameState.food
    );

    setText(
        "coinValue",
        gameState.coin
    );

    setText(
        "maleVillagerCount",
        gameState.villagers.male
    );

    setText(
        "femaleVillagerCount",
        gameState.villagers.female
    );

    setText(
        "childVillagerCount",
        gameState.villagers.child
    );

}


let messageTimer =
    null;


function showFieldMessage(
    message
) {

    if (!fieldMessage) {
        return;
    }


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


    const slotNumber =
        slot.dataset.slotNumber;

    const cardId =
        slot.dataset.cardId;


    if (!cardId) {

        showFieldMessage(
            `Deployment ${slotNumber} awaits a card.`
        );

        return;
    }


    showFieldMessage(
        `Deployment ${slotNumber} holds card ${cardId}.`
    );

}


function handleGameAction(
    action
) {

    switch (
        action
    ) {

        case "booster":

            showFieldMessage(
                "The Booster Hall is not open in V2."
            );

            break;


        case "deck":

            showFieldMessage(
                "Your deck will appear once card records are connected."
            );

            break;


        case "settings":

            showFieldMessage(
                "Battle Settings are not yet bound to the Hold."
            );

            break;


        case "save-exit":

            window.location.href =
                "index.html";

            break;

    }

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


        const actionButton =
            event.target.closest(
                "[data-game-action]"
            );


        if (!actionButton) {
            return;
        }


        handleGameAction(
            actionButton.dataset.gameAction
        );

    }
);


renderHud();


try {

    const townScene =
        createTownScene(
            townMount
        );


    gameState.villagers = {
        ...townScene.counts
    };


    window.EcliptalisTown =
        townScene;


    renderHud();


    requestAnimationFrame(
        () => {

            townLoading?.classList.add(
                "is-hidden"
            );

        }
    );


} catch (error) {

    console.error(
        "Ecliptalis town failed to render:",
        error
    );


    townLoading?.remove();


    const errorMessage =
        document.createElement(
            "div"
        );


    errorMessage.className =
        "three-town-error";


    errorMessage.textContent =
        "The Hold could not be rendered. This browser may not support the required WebGL features.";


    townMount.appendChild(
        errorMessage
    );

}
