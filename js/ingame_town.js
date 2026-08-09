(() => {

    const town =
        document.getElementById(
            "town"
        );


    if (!town) return;


    const paths = [
        "town-path-north",
        "town-path-east",
        "town-path-south-east",
        "town-path-west"
    ];


    paths.forEach(
        (pathClass) => {

            const path =
                document.createElement(
                    "div"
                );

            path.className =
                `town-path ${pathClass}`;

            town.appendChild(path);

        }
    );


    const huts = [
        "hut-a",
        "hut-b",
        "hut-c",
        "hut-d"
    ];


    huts.forEach(
        (hutClass) => {

            const hut =
                document.createElement(
                    "div"
                );

            hut.className =
                `town-hut ${hutClass}`;

            hut.innerHTML = `
                <div class="hut-roof"></div>
                <div class="hut-door"></div>
                <div class="hut-chimney"></div>
            `;

            town.appendChild(hut);

        }
    );


    const farm =
        document.createElement(
            "div"
        );

    farm.className =
        "town-farm";

    town.appendChild(farm);


    const well =
        document.createElement(
            "div"
        );

    well.className =
        "town-well";

    town.appendChild(well);


    [
        "fence-a",
        "fence-b",
        "fence-c"
    ].forEach(
        (fenceClass) => {

            const fence =
                document.createElement(
                    "div"
                );

            fence.className =
                `town-fence ${fenceClass}`;

            town.appendChild(fence);

        }
    );


    const nameplate =
        document.createElement(
            "div"
        );

    nameplate.className =
        "town-nameplate";

    nameplate.textContent =
        "The Hold";

    town.appendChild(nameplate);

})();
