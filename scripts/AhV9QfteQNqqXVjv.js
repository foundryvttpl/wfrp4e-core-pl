let qualities = {
    fast : "Szybka",
    hack : "Rabanie",
    impale : "Przebijajaca",
    penetrating : "Penetrujaca",
    precise : "Precyzyjna"
}

let choice = await ItemDialog.create(ItemDialog.objectToArray(qualities, this.item.img), 1, {text: "Wybierz zalete", title: this.effect.name});

if (choice[0])
{
    this.script.message(choice[0].name);
    this.effect.setFlag("wfrp4e", "quality", choice[0].id);
}
