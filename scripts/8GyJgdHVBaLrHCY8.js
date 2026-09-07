let type = this.item.getFlag("wfrp4e", "breath")
let types = {
    none : "Brak",
    cold : "Zimno",
    corrosion : "Kwas",
    fire : "Ogień",
    electricity : "Elektryczność",
    poison : "Trucizna",
    smoke : "Dym",
    various : "Różne"
}
if (!type)
{
    type = (await ItemDialog.create(ItemDialog.objectToArray(types, this.item.img), 1, "Wybierz rodzaj Zionięcia"))[0]?.id;
    this.item.updateSource({"flags.wfrp4e.breath" : type})
}

if (!this.item.name.includes("(") && types[type] && type != "none")
{
    this.item.updateSource({name : this.item.name += ` (${types[type]})`, "system.specification.value" : this.item.system.specification.value.replace("(Typ)", "").trim()})
}
