// This script needs to be separate because equipTransfer is off on the other effect, and thus won't execute when added to an actor

let mainEffect = this.item.effects.contents[0];
if (mainEffect.name.includes("(Tradycja)"))
{
    let choice = await ItemDialog.create(ItemDialog.objectToArray(game.wfrp4e.config.magicLores, this.item.img), 1, "Wybierz Tradycję Magiczną");
    if (choice.length)
    {
        mainEffect.update({name : mainEffect.name.replace("Tradycja", choice[0].name)})
        this.item.update({name : this.item.name += ` (${choice[0].name})`})
    }
}

this.effect.delete();
