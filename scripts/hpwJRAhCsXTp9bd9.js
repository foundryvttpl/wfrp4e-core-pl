let choice1 = [
    {
        type : "skill",
        name : "Broń Biała (Podstawowa)",
        diff : {
            system : {
                advances : {
                    value : 20
                }
            }
        }
    }
]
let choice2 = [
    {
        type : "skill",
        name : "Broń Biała (Drzewcowa)",
        diff : {
            system : {
                advances : {
                    value : 20
                }
            }
        }
    }
]

let choice3 = [
    {
        type : "skill",
        name : "Broń Biała (Dwuręczna)",
        diff : {
            system : {
                advances : {
                    value : 20
                }
            }
        }
    }
]

let choice = await foundry.applications.api.DialogV2.wait({
        window : {title : "Wybór"},
        content : 
        `<p>
        Wybierz opcję
        </p>
        <ol>
        <li>Broń Biała (Podstawowa)</li>
        <li>Broń Biała (Drzewcowa)</li>
        <li>Broń Biała (Dwuręczna)</li>
        </ol> 
        `,
        buttons : [
            {
                label : "Podstawowa",
                action : "basic",
                callback : () => {
                    return choice1
                }
            },
            {
                label : "Drzewcowa",
                action : "polearm",
                callback : () => {
                    return choice2
                }
            },
            {
                label : "Dwuręczna",
                action : "two-handed",
                callback : () => {
                    return choice3
                }
            }
    ]
})

let updateObj = this.actor.toObject();
let items = []
for (let c of choice)
{
    let existing 
    if (c.type == "skill")
    {
        existing = updateObj.items.find(i => i.name == c.name && i.type == c.type)
        if (existing && c.diff?.system?.advances?.value)
        {
            existing.system.advances.value += c.diff.system.advances.value
        }
    }

    if (!existing)
    {
        let item = await game.wfrp4e.utility.find(c.name, c.type)
        if (item)
        {
            let equip = item.system.tags.has("equippable");
            item = item.toObject()
            if (equip)
            {
                item.system.equipped.value = true;
            }
            items.push(foundry.utils.mergeObject(item, (c.diff || {})))
        }
        else
            ui.notifications.warn(`Could not find ${talent}`, {permanent : true})
    }

}
await this.actor.update(updateObj)
this.actor.createEmbeddedDocuments("Item", items);
