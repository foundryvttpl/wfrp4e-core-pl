Hooks.on("init", () => {
    if (game.modules.get("wfrp4e-rnhd")?.active) {
        
        game.settings.register("wfrp4e-rnhd", "clock", {
            name: "Zegar",
            scope: "world",
            config: false,
            default: {},
            type: Object
        });

        game.settings.register("wfrp4e-rnhd", "clockApp", {
            name: "Aplikacja Zegara",
            scope: "client",
            config: false,
            default: {},
            type: Object
        });

        game.settings.register("wfrp4e-rnhd", "showClock", {
            name: "Pokaż Zegar",
            hint: "Pokazuje aplikacje Zegara po uruchomieniu.",
            scope: "world",
            config: true,
            default: true,
            type: Boolean
        });

        game.settings.register("wfrp4e-rnhd", "syncClock", {
            name: "Synchronizuj Zegar z Simple Calendar",
            hint: "Synchronizuje zegar z modułem Simple Calendar",
            scope: "world",
            config: true,
            default: false,
            type: Boolean
        });

        setTimeout(async () => {
            let WFRP4E = game.wfrp4e.config
            WFRP4E.species["gnome"] = "Gnom"

            WFRP4E.speciesSkills["gnome"] = [
                "Splatanie Magii (Ulgu)",
                "Charyzma",
                "Mocna Głowa",
                "Unik",
                "Wystepy (Dowolny)",
                "Plotkowanie",
                "Targowanie",
                "Język (Ghassally)",
                "Język(Magiczny)",
                "Język (Wastelander)",
                "Sztuka Przetrwania",
                "Skradanie (Dowolne)"
            ]

            WFRP4E.speciesTalents["gnome"] = [
                "Niegodny Uwagi, Dostrojony do Ulgu",
                "Szczęście, Naśladowca",
                "Widzenie w Ciemności",
                "Rybak, Czytanie/Pisanie",
                "Percepcja Magiczna, Szósty Zmysł",
                "Mały",
                0
            ]}, 1000);
        }
    }
);
