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
})();
