(() => {
    const canvas = document.getElementById("mainScreenSparks");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    let width = 0;
    let height = 0;
    let dpr = 1;

    const particles = [];
    const PARTICLE_COUNT = 55;

    function resizeCanvas() {
        width = window.innerWidth;
        height = window.innerHeight;

        dpr = Math.min(window.devicePixelRatio || 1, 2);

        canvas.width = width * dpr;
        canvas.height = height * dpr;

        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    class Spark {
        constructor(initial = false) {
            this.reset(initial);
        }

        reset(initial = false) {
            this.x =
                Math.random() * Math.min(width * 0.52, 750)
                - 100;

            this.y = initial
                ? Math.random() * height
                : -Math.random() * 220 - 20;

            this.velocityX = 0.15 + Math.random() * 0.65;
            this.velocityY = 0.8 + Math.random() * 2.1;

            this.size = 0.6 + Math.random() * 1.8;
            this.length = 2 + Math.random() * 7;

            this.opacity = 0.08 + Math.random() * 0.38;

            this.flickerSpeed = 0.015 + Math.random() * 0.035;
            this.flicker = Math.random() * Math.PI * 2;

            this.wave = Math.random() * Math.PI * 2;
            this.waveSpeed = 0.005 + Math.random() * 0.012;

            const colourRoll = Math.random();

            if (colourRoll < 0.08) {
                this.color = { r: 210, g: 28, b: 35 };
                this.opacity *= 0.8;
            } else if (colourRoll < 0.55) {
                this.color = { r: 135, g: 126, b: 168 };
            } else {
                this.color = { r: 185, g: 186, b: 200 };
            }
        }

        update() {
            this.wave += this.waveSpeed;

            this.x +=
                this.velocityX +
                Math.sin(this.wave) * 0.12;

            this.y += this.velocityY;

            this.flicker += this.flickerSpeed;

            if (
                this.y > height + 40 ||
                this.x > width * 0.62
            ) {
                this.reset();
            }
        }

        draw() {
            const flicker =
                0.65 +
                Math.sin(this.flicker) * 0.35;

            const alpha =
                Math.max(
                    0,
                    this.opacity * flicker
                );

            const fadeStart = width * 0.32;
            const fadeEnd = width * 0.58;

            let horizontalFade = 1;

            if (this.x > fadeStart) {
                horizontalFade =
                    1 -
                    (
                        (this.x - fadeStart) /
                        (fadeEnd - fadeStart)
                    );

                horizontalFade =
                    Math.max(0, horizontalFade);
            }

            const finalAlpha =
                alpha * horizontalFade;

            if (finalAlpha <= 0.01) return;

            const angle =
                Math.atan2(
                    this.velocityY,
                    this.velocityX
                );

            ctx.save();

            ctx.translate(this.x, this.y);
            ctx.rotate(angle);

            ctx.shadowBlur = this.size * 5;

            ctx.shadowColor =
                `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${finalAlpha})`;

            const gradient =
                ctx.createLinearGradient(
                    0,
                    0,
                    0,
                    -this.length
                );

            gradient.addColorStop(
                0,
                `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${finalAlpha})`
            );

            gradient.addColorStop(
                1,
                `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0)`
            );

            ctx.strokeStyle = gradient;
            ctx.lineWidth = this.size;
            ctx.lineCap = "round";

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, -this.length);
            ctx.stroke();

            ctx.fillStyle =
                `rgba(${Math.min(255, this.color.r + 30)}, ${Math.min(255, this.color.g + 30)}, ${Math.min(255, this.color.b + 30)}, ${finalAlpha})`;

            ctx.beginPath();
            ctx.arc(
                0,
                0,
                this.size * 0.55,
                0,
                Math.PI * 2
            );
            ctx.fill();

            ctx.restore();
        }
    }

    function createParticles() {
        particles.length = 0;

        for (
            let i = 0;
            i < PARTICLE_COUNT;
            i++
        ) {
            particles.push(
                new Spark(true)
            );
        }
    }

    function animate() {
        ctx.clearRect(
            0,
            0,
            width,
            height
        );

        for (const particle of particles) {
            particle.update();
            particle.draw();
        }

        requestAnimationFrame(animate);
    }

    const reducedMotion =
        window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        );

    if (reducedMotion.matches) {
        resizeCanvas();
        return;
    }

    resizeCanvas();
    createParticles();
    animate();

    window.addEventListener(
        "resize",
        () => {
            resizeCanvas();
            createParticles();
        }
    );

    /* ========================================
   MAIN MENU
======================================== */

const menuContent =
    document.getElementById("menuContent");


if (menuContent) {

    menuContent.addEventListener(
        "click",
        (event) => {

            const actionButton =
                event.target.closest(
                    "[data-menu-action]"
                );


            if (actionButton) {

                const action =
                    actionButton.dataset.menuAction;


                if (action === "establish") {
                    showEstablishHold();
                }

                if (action === "return") {
                    showReturnHold();
                }


                return;
            }


            if (
                event.target.closest(
                    "#sealHoldButton"
                )
            ) {
                forgeSeal();

                return;
            }


            const numberKey =
                event.target.closest(
                    "[data-seal-number]"
                );


            if (numberKey) {

                if (enteredSeal.length >= 4) {
                    return;
                }

                enteredSeal +=
                    numberKey.dataset.sealNumber;

                numberKey.classList.add(
                    "is-pressed"
                );

                window.setTimeout(
                    () => {
                        numberKey.classList.remove(
                            "is-pressed"
                        );
                    },
                    180
                );

                updateSealSlots();

                return;
            }


            const sealAction =
                event.target.closest(
                    "[data-seal-action]"
                );


            if (sealAction) {

                const sealCommand =
                    sealAction.dataset.sealAction;


                if (sealCommand === "erase") {

                    enteredSeal =
                        enteredSeal.slice(
                            0,
                            -1
                        );

                    updateSealSlots();

                    return;
                }


                if (
                    sealCommand === "enter" &&
                    enteredSeal.length === 4
                ) {

                    attemptReturnToHold();

                    return;
                }

            }


            if (
                event.target.closest(
                    "[data-return-main]"
                )
            ) {

                enteredSeal = "";

                showMainMenu();

                return;
            }


            if (
                event.target.closest(
                    "#holdReturnButton"
                )
            ) {
                showMainMenu();
            }

        }
    );

}


/* ========================================
   MAIN MENU HTML
======================================== */

function showMainMenu() {

    menuContent.innerHTML = `
        <nav
            class="menu-options"
            aria-label="Main menu"
        >

            <button
                class="menu-button"
                type="button"
                data-menu-action="establish"
            >
                Establish Your Hold
            </button>


            <button
                class="menu-button"
                type="button"
                data-menu-action="return"
            >
                Return to Your Hold
            </button>


            <button
                class="menu-button"
                type="button"
                data-menu-action="settings"
            >
                Battle Settings
            </button>


            <button
                class="menu-button"
                type="button"
                data-menu-action="withdraw"
            >
                Withdraw
            </button>

        </nav>
    `;

}


/* ========================================
   ESTABLISH HOLD
======================================== */

function showEstablishHold() {

    menuContent.innerHTML = `
        <div class="hold-panel">

            <label
                class="hold-label"
                for="holdName"
            >
                Hold Name
            </label>


            <input
                id="holdName"
                class="hold-name-input"
                type="text"
                maxlength="24"
                autocomplete="off"
                spellcheck="false"
                placeholder="Name your Hold"
            >


            <button
                id="sealHoldButton"
                class="seal-hold-button"
                type="button"
            >
                Seal Your Hold
            </button>


            <div
                id="holdError"
                class="hold-error"
                aria-live="polite"
            ></div>


            <div
                id="sealForgingText"
                class="seal-forging-text"
            >
                &gt; A Seal will be forged for you
            </div>


            <div
                id="generatedSeal"
                class="generated-seal"
                aria-live="polite"
            ></div>


            <div
                id="sealWarning"
                class="seal-warning"
            >
                Keep this Seal.
                It grants passage back to your Hold.
            </div>


            <button
                id="holdReturnButton"
                class="hold-return-button"
                type="button"
            >
                Return
            </button>

        </div>
    `;


    const holdName =
        document.getElementById("holdName");


    requestAnimationFrame(
        () => holdName?.focus()
    );

}


/* ========================================
   RETURN TO HOLD
======================================== */

let enteredSeal = "";


function showReturnHold() {

    enteredSeal = "";

    menuContent.innerHTML = `
        <div class="return-hold-panel">

            <label
                class="hold-label"
                for="returnHoldName"
            >
                Hold Name
            </label>


            <input
                id="returnHoldName"
                class="hold-name-input"
                type="text"
                maxlength="24"
                autocomplete="off"
                spellcheck="false"
                placeholder="Name your Hold"
            >


            <div class="return-seal-title">
                Seal
            </div>


            <div
                id="sealSlots"
                class="seal-slots"
                aria-label="Four digit Seal"
            >
                <div class="seal-slot"></div>
                <div class="seal-slot"></div>
                <div class="seal-slot"></div>
                <div class="seal-slot"></div>
            </div>


            <div class="seal-ledger">

                <div class="seal-ledger-mark">
                    Mark the Seal borne by your Hold
                </div>


                <div class="seal-keypad">

                    <button type="button" class="seal-key" data-seal-number="1">1</button>
                    <button type="button" class="seal-key" data-seal-number="2">2</button>
                    <button type="button" class="seal-key" data-seal-number="3">3</button>

                    <button type="button" class="seal-key" data-seal-number="4">4</button>
                    <button type="button" class="seal-key" data-seal-number="5">5</button>
                    <button type="button" class="seal-key" data-seal-number="6">6</button>

                    <button type="button" class="seal-key" data-seal-number="7">7</button>
                    <button type="button" class="seal-key" data-seal-number="8">8</button>
                    <button type="button" class="seal-key" data-seal-number="9">9</button>

                    <button
                        type="button"
                        class="seal-key seal-key-command"
                        data-seal-action="erase"
                        aria-label="Erase last digit"
                    >
                        ‹
                    </button>

                    <button type="button" class="seal-key" data-seal-number="0">0</button>

                    <button
                        type="button"
                        id="enterHoldButton"
                        class="seal-key seal-key-command seal-key-enter"
                        data-seal-action="enter"
                        aria-label="Enter Hold"
                        disabled
                    >
                        ›
                    </button>

                </div>

            </div>


            <div
                id="returnHoldMessage"
                class="return-hold-message"
                aria-live="polite"
            ></div>


            <button
                class="return-menu-button"
                type="button"
                data-return-main
            >
                Return
            </button>

        </div>
    `;


    const holdName =
        document.getElementById(
            "returnHoldName"
        );


    requestAnimationFrame(
        () => holdName?.focus()
    );

}


function updateSealSlots() {

    const slots =
        document.querySelectorAll(
            ".seal-slot"
        );


    slots.forEach(
        (slot, index) => {

            const digit =
                enteredSeal[index];

            slot.textContent =
                digit || "";

            slot.classList.remove(
                "is-inscribed"
            );


            if (digit) {

                requestAnimationFrame(
                    () => {
                        slot.classList.add(
                            "is-inscribed"
                        );
                    }
                );

            }

        }
    );


    const enterButton =
        document.getElementById(
            "enterHoldButton"
        );


    if (enterButton) {

        enterButton.disabled =
            enteredSeal.length !== 4;

    }

}


function attemptReturnToHold() {

    const holdNameInput =
        document.getElementById(
            "returnHoldName"
        );

    const message =
        document.getElementById(
            "returnHoldMessage"
        );


    const holdName =
        holdNameInput.value.trim();


    if (!holdName) {

        message.textContent =
            "Speak the name of your Hold.";

        holdNameInput.focus();

        return;
    }


    if (enteredSeal.length !== 4) {

        message.textContent =
            "The Seal is incomplete.";

        return;
    }


    message.textContent =
        "The Seal is complete.";


    /*
     * Later:
     *
     * Validate Hold Name + Seal
     * against the saved Hold record.
     */

}


/* ========================================
   FORGE SEAL
======================================== */

let sealForging = false;


function forgeSeal() {

    if (sealForging) return;


    const holdNameInput =
        document.getElementById("holdName");

    const error =
        document.getElementById("holdError");

    const forgingText =
        document.getElementById(
            "sealForgingText"
        );

    const generatedSeal =
        document.getElementById(
            "generatedSeal"
        );

    const sealWarning =
        document.getElementById(
            "sealWarning"
        );

    const returnButton =
        document.getElementById(
            "holdReturnButton"
        );

    const sealButton =
        document.getElementById(
            "sealHoldButton"
        );


    const holdName =
        holdNameInput.value.trim();


    if (!holdName) {

        error.textContent =
            "Your Hold must first bear a name.";

        holdNameInput.focus();

        return;
    }


    error.textContent = "";

    sealForging = true;


    /*
     * Lock the name once forging begins.
     */

    holdNameInput.disabled = true;

    sealButton.disabled = true;

    sealButton.style.opacity = "0.35";

    sealButton.style.cursor = "default";


    /*
     * First reveal:
     * A Seal will be forged for you
     */

    forgingText.classList.add(
        "is-visible"
    );


    /*
     * Generate a four-digit Seal.
     *
     * 1000 - 9999
     */

    const seal =
        Math.floor(
            1000 +
            Math.random() * 9000
        );


    /*
     * Reveal the Seal after the
     * forging message has had time
     * to breathe.
     */

    window.setTimeout(
        () => {

            generatedSeal.textContent =
                String(seal)
                    .split("")
                    .join("  ");

            generatedSeal.classList.add(
                "is-visible"
            );

        },
        1700
    );


    /*
     * Reveal the ancient warning.
     */

    window.setTimeout(
        () => {

            sealWarning.classList.add(
                "is-visible"
            );

        },
        2800
    );


    /*
     * Finally allow return.
     */

    window.setTimeout(
        () => {

            returnButton.classList.add(
                "is-visible"
            );

            sealForging = false;

        },
        3500
    );

}
})();
