// Each time the blade is used, the GM should secretly roll a d10.
// On a 1, its poison has run dry, 
// and the next time it is employed it will shatter.

if (this.item.getFlag("wfrp4e", "brittle"))
{
    ChatMessage.create({content: `<strong>${this.item.name}</strong> ulega rozbiciu!`})
    this.item.update({name : `${this.item.name} (Rozbity)`})
}
