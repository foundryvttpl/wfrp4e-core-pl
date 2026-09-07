let items = this.effect.itemTargets;
let msg = "";
for(let item of items)
{
    if (item.system.properties.qualities.durable)
    {
        await item.update({"system.qualities.value" : []});
        msg += `<p>${item.name}: utracono wszystkie Zalety</p>`
    }
    else 
    {
        msg += `<p>${item.name}: rozsypano w pył!</p>` 
        await item.update({name : item.name + " (Pył)"})
    }
}
if(msg)
{
    this.script.message(msg);
}
