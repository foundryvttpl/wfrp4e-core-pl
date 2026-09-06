if (isNaN(parseInt(this.item.system.specification.value)))
{
    let value = await ValueDialog.create({text : "Ustal Poziom Strachu", title : this.effect.name});
    if (value)
    {
     this.item.updateSource({"system.specification.value" : value});
    }
}
