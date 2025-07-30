let choice1 = [
    {
        type : "armour",
        name : "Nogawice kolcze"
    },
    {
        type : "armour",
        name : "Kolczuga"
    },
    {
        type : "armour",
        name : "Czepiec kolczy"
    },
]
let choice2 = [
    {
        type : "armour",
        name : "Nogawice kolcze"
    },
    {
        type : "armour",
        name : "Kolczuga"
    },
    {
        type : "armour",
        name : "Czepiec kolczy"
    },
    {
        type : "armour",
        name : "Skórzane nogawice"
    },
    {
        type : "armour",
        name : "Skórzany hełm"
    },
    {
        type : "armour",
        name : "Skórzana kurta"
    },
]
let choice3 = [
    {
        type : "armour",
        name : "Płytowy napierśnik"
    },
    {
        type : "armour",
        name : "Płytowe Naramienniki"
    },
    {
        type : "armour",
        name : "Hełm płytowy"
    },
    {
        type : "armour",
        name : "Płytowe Nagolenniki"
    },
]

let choice = await foundry.applications.api.DialogV2.wait({
    window : {title : "Wybór zbroi"},
    content : 
    `<p>
    Wybierz
    </p>
    <ol>
    <li>Kolczuga</li>
    <li>Kolczuga i skóra</li>
    <li>Płyta</li>
    </ol> 
    `,
    buttons : [
        {
            action : 1,
            label : "Kolczuga",
            callback : () => {
                return choice1
            }
        },
        {
            action : 2,
            label : "Kolczuga i skóra",
            callback : () => {
                return choice2
            }
        },
        {
            action : 3,
            label : "Płyta",
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
            ui.notifications.warn(`Could not find ${c.name}`, {permanent : true})
    }

}
await this.actor.update(updateObj)
this.actor.createEmbeddedDocuments("Item", items);
