if (args.test.spell?.getFlag("wfrp4e", "boonOfTzeentch"))
{
    if (args.test.result.minormis || args.test.result.majormis || args.test.result.catastrophicmis)
    {
        this.script.message(`<strong>${this.effect.name}</strong> opuszcza twój umysł z obrzydzeniem i wymazuje się z twojej księgi!`)
        this.effect.sourceItem.delete();
    }
}
