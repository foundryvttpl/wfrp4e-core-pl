let properties = {
    fine : "Dobra jakosc",
    durable : "Wytrzymala",
    lightweight : "Lekka",
    practical : "Praktyczna"
};


let choice = await ItemDialog.create(ItemDialog.objectToArray(properties), 1, {title: this.effect.name, text: "Wybierz wlasciwosc"});

if (choice[0])
{
    this.effect.updateSource({"flags.wfrp4e.property" : choice[0].id, name : this.effect.setSpecifier(choice[0].name)});
}
