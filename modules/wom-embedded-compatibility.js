// Verified WOM8.0.0 embedded rule routing; QA inheritance-formulas-20261006.
// Source documents retain their own ID, rating, mechanics and local overrides.
const RULES = Object.freeze({
  "wfrp4e-core.items.Fs06sr7y9JKpVQmB": {
    "name": "Perception",
    "type": "skill",
    "pack": "wfrp4e-core.items",
    "canonicalId": "Fs06sr7y9JKpVQmB",
    "sourceDescription": "<p>@Embed[Compendium.wfrp4e-core.journals.6zOdTLv3YeYeJ4hR.JournalEntryPage.6Jhks0zDRpJeN6dW caption=false]{Perception}",
    "guardFields": {
      "system.range.value": null,
      "system.target.value": null,
      "system.duration.value": null,
      "system.damage.value": null,
      "system.lore.value": null,
      "system.cn.value": null,
      "system.characteristic.value": "i",
      "system.grouped.value": "noSpec",
      "system.tests.value": null,
      "system.special.value": null
    },
    "sourceScripts": []
  },
  "wfrp4e-core.items.sRuMlaPU5xdIrwhd": {
    "name": "Climb",
    "type": "skill",
    "pack": "wfrp4e-core.items",
    "canonicalId": "sRuMlaPU5xdIrwhd",
    "sourceDescription": "<p>@Embed[Compendium.wfrp4e-core.journals.6zOdTLv3YeYeJ4hR.JournalEntryPage.yOONKSIBrg4FOl20 caption=false]{Climb}",
    "guardFields": {
      "system.range.value": null,
      "system.target.value": null,
      "system.duration.value": null,
      "system.damage.value": null,
      "system.lore.value": null,
      "system.cn.value": null,
      "system.characteristic.value": "s",
      "system.grouped.value": "noSpec",
      "system.tests.value": null,
      "system.special.value": null
    },
    "sourceScripts": []
  },
  "wfrp4e-core.items.zZUX7wO4rOo8k9F0": {
    "name": "Navigation",
    "type": "skill",
    "pack": "wfrp4e-core.items",
    "canonicalId": "zZUX7wO4rOo8k9F0",
    "sourceDescription": "<p>@Embed[Compendium.wfrp4e-core.journals.6zOdTLv3YeYeJ4hR.JournalEntryPage.rf7gtZko4KJvjFaE caption=false]{Navigation}",
    "guardFields": {
      "system.range.value": null,
      "system.target.value": null,
      "system.duration.value": null,
      "system.damage.value": null,
      "system.lore.value": null,
      "system.cn.value": null,
      "system.characteristic.value": "i",
      "system.grouped.value": "noSpec",
      "system.tests.value": null,
      "system.special.value": null
    },
    "sourceScripts": []
  },
  "wfrp4e-wom.items.lVAAphWi2iP40ccJ": {
    "name": "Daemonbane",
    "type": "spell",
    "pack": "wfrp4e-wom.items",
    "canonicalId": "lVAAphWi2iP40ccJ",
    "sourceDescription": "<p>You summon a blast of Hysh that passes through the border between the Realm of Chaos and the material world. The Casting Test is Opposed by the target’s Willpower. If you win, you obliterate a target with the Daemonic Creature Trait with a blinding white light, sending it back whence it came. If the spell successfully banishes a Daemon, everyone looking at your target, unless they possess the Arcane Magic (Light) Talent, receives +SL @Condition[Blinded] Conditions. </p><p>\n\n <b>Lore:</b> You may inflict one @Condition[Blinded] Condition on those targeted by Lore of Light spells, unless they possess the Arcane Magic (Light) Talent. If a target has the @UUID[Compendium.wfrp4e-core.items.v3uzEthcq0JRar0J]{Daemonic} or @UUID[Compendium.wfrp4e-core.items.PFTD9gDvRWW9uh5g]{Undead} Creature Traits, spells also inflict an additional hit with Damage equal to your Intelligence Bonus that ignores Toughness Bonus and Armor Points.<p>",
    "guardFields": {
      "system.range.value": "Willpower Bonus yards",
      "system.target.value": "1",
      "system.duration.value": "Instant",
      "system.damage.value": "",
      "system.lore.value": "light",
      "system.cn.value": 10,
      "system.characteristic.value": null,
      "system.grouped.value": null,
      "system.tests.value": null,
      "system.special.value": null
    },
    "sourceScripts": [
      [
        "immediate",
        "[Script.9ob2lPnk3PDot9Tx]",
        {
          "dialog": {
            "hideScript": "",
            "activateScript": "",
            "submissionScript": "",
            "targeter": false
          },
          "immediate": {
            "deleteEffect": true
          },
          "hideScript": "",
          "activateScript": "",
          "submissionScript": "",
          "targeter": false,
          "deleteEffect": true
        }
      ]
    ]
  },
  "wfrp4e-wom.items.3s0l2R7dplULuMtl": {
    "name": "Phâ’s Protection",
    "type": "spell",
    "pack": "wfrp4e-wom.items",
    "canonicalId": "3s0l2R7dplULuMtl",
    "sourceDescription": "<p>You summon a protective aura of pure holy light. Profane creatures — those with the @UUID[Compendium.wfrp4e-core.items.PFTD9gDvRWW9uh5g]{Undead} or @UUID[Compendium.wfrp4e-core.items.v3uzEthcq0JRar0J]{Daemonic} Creature Trait, those with mutations, and those with more Corruption than their Willpower Bonus and Toughness Bonus combined — cannot enter the Area of Effect. Any already within the area gain the @Condition[Broken] Condition until they leave. Creatures within the area cannot gain any Corruption points while the spell is active.</p><p><strong>Lore:</strong> You may inflict one @Condition[Blinded] Condition on those targeted by Lore of Light spells, unless they possess the Arcane Magic (Light) Talent. If a target has the @UUID[Compendium.wfrp4e-core.items.v3uzEthcq0JRar0J]{Daemonic} or @UUID[Compendium.wfrp4e-core.items.PFTD9gDvRWW9uh5g]{Undead} Creature Traits, spells also inflict an additional hit with Damage equal to your Intelligence Bonus that ignores Toughness Bonus and Armor Points.</p><p></p>",
    "guardFields": {
      "system.range.value": "You",
      "system.target.value": "Willpower Bonus yards",
      "system.duration.value": "Willpower Bonus rounds",
      "system.damage.value": "",
      "system.lore.value": "light",
      "system.cn.value": 10,
      "system.characteristic.value": null,
      "system.grouped.value": null,
      "system.tests.value": null,
      "system.special.value": null
    },
    "sourceScripts": [
      [
        "immediate",
        "[Script.ERxrWzSpw8qwxFVi]",
        {
          "dialog": {
            "hideScript": "",
            "activateScript": "",
            "submissionScript": "",
            "targeter": false
          },
          "immediate": {
            "deleteEffect": false
          },
          "hideScript": "",
          "activateScript": "",
          "submissionScript": "",
          "targeter": false,
          "deleteEffect": false
        }
      ]
    ]
  },
  "wfrp4e-wom.items.5ZBlXMHlrdIlaDr1": {
    "name": "Concoct",
    "type": "talent",
    "pack": "wfrp4e-wom.items",
    "canonicalId": "5ZBlXMHlrdIlaDr1",
    "sourceDescription": "<p>You are skilled at making potions, philtres, and draughts on the go. You may take one free @UUID[Compendium.wfrp4e-core.journals.gLDW6JBuoYuzCoya.JournalEntryPage.RQLJYU3OyA0WUoPG]{Crafting} Endeavour or @UUID[JournalEntry.CpVn7Hp5hz7NmpYu.JournalEntryPage.hS8fXNOVs0vTvpiD]{Brew Potion} Endeavour to use Trade (Apothecary) or Trade (Alchemist) without the need for a workshop or laboratory. Other Crafting Endeavours are not affected.</p>",
    "guardFields": {
      "system.range.value": null,
      "system.target.value": null,
      "system.duration.value": null,
      "system.damage.value": null,
      "system.lore.value": null,
      "system.cn.value": null,
      "system.characteristic.value": null,
      "system.grouped.value": null,
      "system.tests.value": "Trade (Apothecary) and Trade (Alchemist)",
      "system.special.value": null
    },
    "sourceScripts": [
      [
        "dialog",
        "[Script.956dUb5sd6OtbWZR]",
        {
          "dialog": {
            "hideScript": "[Script.93K85NnVwjVNXlZq]",
            "activateScript": "[Script.DHxUKY9LMyifFgCi]",
            "submissionScript": "",
            "targeter": false
          },
          "immediate": {
            "deleteEffect": false
          },
          "hideScript": "[Script.93K85NnVwjVNXlZq]",
          "activateScript": "[Script.DHxUKY9LMyifFgCi]",
          "submissionScript": "",
          "targeter": false,
          "deleteEffect": false
        }
      ]
    ]
  },
  "wfrp4e-wom.items.2yWwf7T1zUnDIocS": {
    "name": "Crucible of Chamon",
    "type": "spell",
    "pack": "wfrp4e-wom.items",
    "canonicalId": "2yWwf7T1zUnDIocS",
    "sourceDescription": "<p>You channel <em>Chamon</em> into a single non-magical, metallic object, such as a weapon or piece of armour covering a single body part. The item melts, dripping to the floor as molten metal, cooling almost immediately. If held, the item is dropped. If worn, the wearer takes a hit like a magic missile with Damage equal to your Willpower Bonus that ignores Toughness Bonus. While the object is destroyed, the metal retains its base value, and may be used by a smith as raw material.</p><p><strong>Lore:</strong> Spells inflicting Damage ignore Armor Points from metal armor, and inflict bonus Damage equal to the number of Armor Points of metal armor being worn on any Hit Location struck. So, if your spell hit an Arm location protected by 2 Armor Points of metal armor, it would cause an additional +2 Damage and ignore the Armor Points.</p><p></p>",
    "guardFields": {
      "system.range.value": "Willpower Bonus yards",
      "system.target.value": "1 object",
      "system.duration.value": "Instant",
      "system.damage.value": "",
      "system.lore.value": "metal",
      "system.cn.value": 7,
      "system.characteristic.value": null,
      "system.grouped.value": null,
      "system.tests.value": null,
      "system.special.value": null
    },
    "sourceScripts": []
  },
  "wfrp4e-wom.items.SpDC6uiVUE2C08NS": {
    "name": "Enchant Weapon",
    "type": "spell",
    "pack": "wfrp4e-wom.items",
    "canonicalId": "SpDC6uiVUE2C08NS",
    "sourceDescription": "<p>You encase a single non-magical weapon with heavy bands of Chamon, enhancing its potency. For the duration of the spell it counts as magical, gains a bonus to Damage equal to your Willpower Bonus, and gains the @UUID[Compendium.wfrp4e-core.journals.sLomXnc8R8518cWN.JournalEntryPage.wdXywmb7FBVipOw8#unbreakable]{Unbreakable} Quality. For every +3 SL you may also add 1 Weapon Quality or remove 1 Weapon Flaw from the weapon, while the spell is in effect.</p><p><strong>Lore:</strong> Spells inflicting Damage ignore Armor Points from metal armor, and inflict bonus Damage equal to the number of Armor Points of metal armor being worn on any Hit Location struck. So, if your spell hit an Arm location protected by 2 Armor Points of metal armor, it would cause an additional +2 Damage and ignore the Armor Points.</p><p></p>",
    "guardFields": {
      "system.range.value": "Touch",
      "system.target.value": "special",
      "system.duration.value": "Willpower Bonus rounds",
      "system.damage.value": "",
      "system.lore.value": "metal",
      "system.cn.value": 6,
      "system.characteristic.value": null,
      "system.grouped.value": null,
      "system.tests.value": null,
      "system.special.value": null
    },
    "sourceScripts": [
      [
        "prepareOwned",
        "[Script.9qWUuEF8F5nehF1y]",
        {
          "dialog": {
            "hideScript": "",
            "activateScript": "",
            "submissionScript": "",
            "targeter": false
          },
          "immediate": {
            "deleteEffect": false
          },
          "hideScript": "",
          "activateScript": "",
          "submissionScript": "",
          "targeter": false,
          "deleteEffect": false
        }
      ]
    ]
  },
  "wfrp4e-wom.items.WarJYR6TpkVwfuCv": {
    "name": "Forge of Chamon",
    "type": "spell",
    "pack": "wfrp4e-wom.items",
    "canonicalId": "WarJYR6TpkVwfuCv",
    "sourceDescription": "<p>You alter the quality of a metal item. You may add 1 Item Quality or remove 1 Item Flaw. For every +2 SL, you may add another Item Quality or remove another Item Flaw. </p><p>\n\n <b>Lore:</b> Spells inflicting Damage ignore Armor Points from metal armor, and inflict bonus Damage equal to the number of Armor Points of metal armor being worn on any Hit Location struck. So, if your spell hit an Arm location protected by 2 Armor Points of metal armor, it would cause an additional +2 Damage and ignore the Armor Points.<p>",
    "guardFields": {
      "system.range.value": "Willpower Bonus yards",
      "system.target.value": "Special",
      "system.duration.value": "Willpower minutes",
      "system.damage.value": "",
      "system.lore.value": "metal",
      "system.cn.value": 9,
      "system.characteristic.value": null,
      "system.grouped.value": null,
      "system.tests.value": null,
      "system.special.value": null
    },
    "sourceScripts": [
      [
        "immediate",
        "[Script.a8i0sA1RBnD8nHZt]",
        {
          "dialog": {
            "hideScript": "",
            "activateScript": "",
            "submissionScript": "",
            "targeter": false
          },
          "immediate": {
            "deleteEffect": false
          },
          "hideScript": "",
          "activateScript": "",
          "submissionScript": "",
          "targeter": false,
          "deleteEffect": false
        }
      ],
      [
        "prePrepareData",
        "[Script.zqShIJnrRReGgP94]",
        {
          "dialog": {
            "hideScript": "",
            "activateScript": "",
            "submissionScript": "",
            "targeter": false
          },
          "immediate": {
            "deleteEffect": false
          },
          "hideScript": "",
          "activateScript": "",
          "submissionScript": "",
          "targeter": false,
          "deleteEffect": false
        }
      ]
    ]
  },
  "wfrp4e-wom.items.a5ugjb2n4i1ZkeUf": {
    "name": "Glittering Robe",
    "type": "spell",
    "pack": "wfrp4e-wom.items",
    "canonicalId": "a5ugjb2n4i1ZkeUf",
    "sourceDescription": "<p>Wild flurries of Chamon whirl around you, deflecting blows and intercepting missiles and magical attacks. Gain the @UUID[Compendium.wfrp4e-core.items.Bvd2aZ0gQUXHfCTh]{Ward (9+)} Creature Trait. against all attacks and spells targeting you. Each hit successfully saved increases the Ward’s effectiveness by 1, to a maximum of Ward (3+).</p><p><strong>Lore:</strong> Spells inflicting Damage ignore Armor Points from metal armor, and inflict bonus Damage equal to the number of Armor Points of metal armor being worn on any Hit Location struck. So, if your spell hit an Arm location protected by 2 Armor Points of metal armor, it would cause an additional +2 Damage and ignore the Armor Points.</p><p></p>",
    "guardFields": {
      "system.range.value": "You",
      "system.target.value": "You",
      "system.duration.value": "Toughness Bonus Rounds",
      "system.damage.value": "",
      "system.lore.value": "metal",
      "system.cn.value": 5,
      "system.characteristic.value": null,
      "system.grouped.value": null,
      "system.tests.value": null,
      "system.special.value": null
    },
    "sourceScripts": [
      [
        "immediate",
        "[Script.j3zDMWkns32Yrxn3]",
        {
          "dialog": {
            "hideScript": "",
            "activateScript": "",
            "submissionScript": "",
            "targeter": false
          },
          "immediate": {
            "deleteEffect": false
          },
          "hideScript": "",
          "activateScript": "",
          "submissionScript": "",
          "targeter": false,
          "deleteEffect": false
        }
      ],
      [
        "preTakeDamage",
        "[Script.cK1Jysfu5IMUUH0C]",
        {
          "dialog": {
            "hideScript": "",
            "activateScript": "",
            "submissionScript": "",
            "targeter": false
          },
          "immediate": {
            "deleteEffect": false
          },
          "hideScript": "",
          "activateScript": "",
          "submissionScript": "",
          "targeter": false,
          "deleteEffect": false
        }
      ]
    ]
  },
  "wfrp4e-wom.items.2FHU23a3IQ1mQG7c": {
    "name": "Transmutation of Chamon",
    "type": "spell",
    "pack": "wfrp4e-wom.items",
    "canonicalId": "2FHU23a3IQ1mQG7c",
    "sourceDescription": "<p>You wrench Chamon from the metals worn by your foes, and the earth itself, briefly transforming the flesh of your enemies into metal. This is a magic missile affecting all in the Area of Effect, with a Damage equal to your Willpower Bonus; the spell ignores Toughness Bonus and inflicts +1 @Condition[Blinded], @Condition[Deafened], and @Condition[Stunned] Condition, all of which last for the duration of the spell. All affected targets gain +1 Armour Point from the gold wrapped about their bodies, but also suffer from @UUID[Compendium.wfrp4e-core.journals.NS3YGlJQxwTggjRX.JournalEntryPage.WCivInLZrqEtZzF4#drowning-and-suffocation]{Suffocation}. If targets die while the spell is in effect, they are permanently encased in a shell of base metals, a macabre reminder of the risks of sorcery.</p><p><strong>Lore:</strong> Spells inflicting Damage ignore Armor Points from metal armor, and inflict bonus Damage equal to the number of Armor Points of metal armor being worn on any Hit Location struck. So, if your spell hit an Arm location protected by 2 Armor Points of metal armor, it would cause an additional +2 Damage and ignore the Armor Points.</p><p></p>",
    "guardFields": {
      "system.range.value": "Willpower yards",
      "system.target.value": "Willpower Bonus yards",
      "system.duration.value": "Willpower Bonus Rounds",
      "system.damage.value": "Willpower Bonus",
      "system.lore.value": "metal",
      "system.cn.value": 12,
      "system.characteristic.value": null,
      "system.grouped.value": null,
      "system.tests.value": null,
      "system.special.value": null
    },
    "sourceScripts": [
      [
        "preApplyDamage",
        "[Script.McLR9YcgVUG3MooC]",
        {
          "dialog": {
            "hideScript": "",
            "activateScript": "",
            "submissionScript": "",
            "targeter": false
          },
          "immediate": {
            "deleteEffect": false
          },
          "hideScript": "",
          "activateScript": "",
          "submissionScript": "",
          "targeter": false,
          "deleteEffect": false
        }
      ],
      [
        "applyDamage",
        "[Script.RqWnhnwFxaHubgiA]",
        {
          "dialog": {
            "hideScript": "",
            "activateScript": "",
            "submissionScript": "",
            "targeter": false
          },
          "immediate": {
            "deleteEffect": false
          },
          "hideScript": "",
          "activateScript": "",
          "submissionScript": "",
          "targeter": false,
          "deleteEffect": false
        }
      ],
      [
        "prepareData",
        "[Script.1ZrzpfVwPJHdwp23]",
        {
          "dialog": {
            "hideScript": "",
            "activateScript": "",
            "submissionScript": "",
            "targeter": false
          },
          "immediate": {
            "deleteEffect": false
          },
          "hideScript": "",
          "activateScript": "",
          "submissionScript": "",
          "targeter": false,
          "deleteEffect": false
        }
      ]
    ]
  },
  "wfrp4e-core.items.qZ4cFy6z482ZONuA": {
    "name": "Sturdy",
    "type": "talent",
    "pack": "wfrp4e-core.items",
    "canonicalId": "qZ4cFy6z482ZONuA",
    "sourceDescription": "<p>You have a brawny physique, or are very used to carrying things. Increase the number of Encumbrance Points you can carry by your Sturdy level x 2</p>",
    "guardFields": {
      "system.range.value": null,
      "system.target.value": null,
      "system.duration.value": null,
      "system.damage.value": null,
      "system.lore.value": null,
      "system.cn.value": null,
      "system.characteristic.value": null,
      "system.grouped.value": null,
      "system.tests.value": "Strength Tests when lifting",
      "system.special.value": null
    },
    "sourceScripts": [
      [
        "computeEncumbrance",
        "[Script.QF8LanKNoAlTkQG0]",
        {
          "dialog": {
            "hideScript": "",
            "activateScript": "",
            "submissionScript": "",
            "targeter": false
          },
          "immediate": {
            "deleteEffect": false
          },
          "hideScript": "",
          "activateScript": "",
          "submissionScript": "",
          "targeter": false,
          "deleteEffect": false
        }
      ],
      [
        "dialog",
        "[Script.wAETU6aTRr9d4oCU]",
        {
          "dialog": {
            "hideScript": "[Script.bWr8leucbWslBCYG]",
            "activateScript": "",
            "submissionScript": "",
            "targeter": false
          },
          "immediate": {
            "deleteEffect": false
          },
          "hideScript": "[Script.bWr8leucbWslBCYG]",
          "activateScript": "",
          "submissionScript": "",
          "targeter": false,
          "deleteEffect": false
        }
      ]
    ]
  },
  "wfrp4e-core.items.mDgEMOoJpi8DkRYb": {
    "name": "Magical",
    "type": "trait",
    "pack": "wfrp4e-core.items",
    "canonicalId": "mDgEMOoJpi8DkRYb",
    "sourceDescription": "<p>The creature is wreathed in magic. All its attacks count as Magical, meaning it can harm creatures only susceptible to magical attacks.</p>",
    "guardFields": {
      "system.range.value": null,
      "system.target.value": null,
      "system.duration.value": null,
      "system.damage.value": null,
      "system.lore.value": null,
      "system.cn.value": null,
      "system.characteristic.value": null,
      "system.grouped.value": null,
      "system.tests.value": null,
      "system.special.value": null
    },
    "sourceScripts": [
      [
        "prepareItem",
        "[Script.WKXyVHQwQCNTfSKv]",
        {
          "dialog": {
            "hideScript": "",
            "activateScript": "",
            "submissionScript": "",
            "targeter": false
          },
          "immediate": {
            "deleteEffect": false
          },
          "hideScript": "",
          "activateScript": "",
          "submissionScript": "",
          "targeter": false,
          "deleteEffect": false
        }
      ]
    ]
  },
  "wfrp4e-core.items.039vRQ8jv5cY3P4o": {
    "name": "Zweihander",
    "type": "weapon",
    "pack": "wfrp4e-core.items",
    "canonicalId": "039vRQ8jv5cY3P4o",
    "sourceDescription": "<p></p>",
    "guardFields": {
      "system.range.value": "",
      "system.target.value": null,
      "system.duration.value": null,
      "system.damage.value": "SB+5",
      "system.lore.value": null,
      "system.cn.value": null,
      "system.characteristic.value": null,
      "system.grouped.value": null,
      "system.tests.value": null,
      "system.special.value": ""
    },
    "sourceScripts": []
  },
  "wfrp4e-core.items.ahlxlfIl8xUhBkic": {
    "name": "Dagger",
    "type": "weapon",
    "pack": "wfrp4e-core.items",
    "canonicalId": "ahlxlfIl8xUhBkic",
    "sourceDescription": "<p></p>",
    "guardFields": {
      "system.range.value": "",
      "system.target.value": null,
      "system.duration.value": null,
      "system.damage.value": "SB+2",
      "system.lore.value": null,
      "system.cn.value": null,
      "system.characteristic.value": null,
      "system.grouped.value": null,
      "system.tests.value": null,
      "system.special.value": ""
    },
    "sourceScripts": []
  },
  "wfrp4e-wom.items.pL6Sczx1q3yOmgMn": {
    "name": "Banishment",
    "type": "spell",
    "pack": "wfrp4e-wom.items",
    "canonicalId": "pL6Sczx1q3yOmgMn",
    "sourceDescription": "<p>You open your hands and a cleansing halo of Hysh issues forth, affecting all creatures within the Area of Effect whose Toughness is lower than your Willpower. Targets with the @UUID[Compendium.wfrp4e-core.items.PFTD9gDvRWW9uh5g]{Undead} or @UUID[Compendium.wfrp4e-core.items.v3uzEthcq0JRar0J]{Daemonic} Creature Traits gain the Unstable Creature Trait. If they already have the Unstable Trait, they are reduced to 0 Wounds.</p><p><strong>Lore:</strong> You may inflict one @Condition[Blinded] Condition on those targeted by Lore of Light spells, unless they possess the Arcane Magic (Light) Talent. If a target has the @UUID[Compendium.wfrp4e-core.items.v3uzEthcq0JRar0J]{Daemonic} or @UUID[Compendium.wfrp4e-core.items.PFTD9gDvRWW9uh5g]{Undead} Creature Traits, spells also inflict an additional hit with Damage equal to your Intelligence Bonus that ignores Toughness Bonus and Armor Points.</p><p></p>",
    "guardFields": {
      "system.range.value": "You",
      "system.target.value": "Willpower Bonus yards",
      "system.duration.value": "Instant",
      "system.damage.value": "",
      "system.lore.value": "light",
      "system.cn.value": 12,
      "system.characteristic.value": null,
      "system.grouped.value": null,
      "system.tests.value": null,
      "system.special.value": null
    },
    "sourceScripts": [
      [
        "addItems",
        "[Script.Fvlc4RkeF4dHjW3m]",
        {
          "dialog": {
            "hideScript": "",
            "activateScript": "",
            "submissionScript": "",
            "targeter": false
          },
          "immediate": {
            "deleteEffect": true
          },
          "hideScript": "",
          "activateScript": "",
          "submissionScript": "",
          "targeter": false,
          "deleteEffect": true
        }
      ]
    ]
  },
  "wfrp4e-wom.items.3ANa4WjBEh5BGI2W": {
    "name": "Blinding Light",
    "type": "spell",
    "pack": "wfrp4e-wom.items",
    "canonicalId": "3ANa4WjBEh5BGI2W",
    "sourceDescription": "<p>You emit a bright, blinding flash of light from your hand or staff. Everyone looking at you, unless they possess the Arcane Magic (Light) Talent, receives +SL @Condition[Blinded] Conditions. </p><p>\n\n <b>Lore:</b> You may inflict one @Condition[Blinded] Condition on those targeted by Lore of Light spells, unless they possess the Arcane Magic (Light) Talent. If a target has the @UUID[Compendium.wfrp4e-core.items.v3uzEthcq0JRar0J]{Daemonic} or @UUID[Compendium.wfrp4e-core.items.PFTD9gDvRWW9uh5g]{Undead} Creature Traits, spells also inflict an additional hit with Damage equal to your Intelligence Bonus that ignores Toughness Bonus and Armor Points.<p>",
    "guardFields": {
      "system.range.value": "Willpower yards",
      "system.target.value": "You",
      "system.duration.value": "Instant",
      "system.damage.value": "",
      "system.lore.value": "light",
      "system.cn.value": 5,
      "system.characteristic.value": null,
      "system.grouped.value": null,
      "system.tests.value": null,
      "system.special.value": null
    },
    "sourceScripts": [
      [
        "immediate",
        "[Script.DcSJNRBXE9ZBBY7T]",
        {
          "dialog": {
            "hideScript": "",
            "activateScript": "",
            "submissionScript": "",
            "targeter": false
          },
          "immediate": {
            "deleteEffect": true
          },
          "hideScript": "",
          "activateScript": "",
          "submissionScript": "",
          "targeter": false,
          "deleteEffect": true
        }
      ]
    ]
  },
  "wfrp4e-wom.items.QMEeB4BonCjEsedj": {
    "name": "Net of Amyntok",
    "type": "spell",
    "pack": "wfrp4e-wom.items",
    "canonicalId": "QMEeB4BonCjEsedj",
    "sourceDescription": "<p>You cast a delicate net woven from strands of Hysh over your targets, whose minds are overcome with conundrums and puzzles, leaving them paralysed with indecision. Targets gain +1 @Condition[Stunned] Condition, which they cannot lose while the spell is in effect. When recovering from the Condition, targets Test their Intelligence instead of the Endurance Skill. Targets with the @UUID[Compendium.wfrp4e-core.items.AGcJl5rHjkyIQBPP]{Bestial} Creature Trait are immune to this spell.</p><p><strong>Lore:</strong> You may inflict one @Condition[Blinded] Condition on those targeted by Lore of Light spells, unless they possess the Arcane Magic (Light) Talent. If a target has the @UUID[Compendium.wfrp4e-core.items.v3uzEthcq0JRar0J]{Daemonic} or @UUID[Compendium.wfrp4e-core.items.PFTD9gDvRWW9uh5g]{Undead} Creature Traits, spells also inflict an additional hit with Damage equal to your Intelligence Bonus that ignores Toughness Bonus and Armor Points.</p><p></p>",
    "guardFields": {
      "system.range.value": "Intelligence Bonus yards",
      "system.target.value": "1",
      "system.duration.value": "Target’s Intelligence Bonus rounds",
      "system.damage.value": "",
      "system.lore.value": "light",
      "system.cn.value": 8,
      "system.characteristic.value": null,
      "system.grouped.value": null,
      "system.tests.value": null,
      "system.special.value": null
    },
    "sourceScripts": [
      [
        "immediate",
        "[Script.V7qmFwUMCY2tfziH]",
        {
          "dialog": {
            "hideScript": "",
            "activateScript": "",
            "submissionScript": "",
            "targeter": false
          },
          "immediate": {
            "deleteEffect": false
          },
          "hideScript": "",
          "activateScript": "",
          "submissionScript": "",
          "targeter": false,
          "deleteEffect": false
        }
      ]
    ]
  },
  "wfrp4e-wom.items.zRsqUAEjUGsDcmvb": {
    "name": "Speed of Thought",
    "type": "spell",
    "pack": "wfrp4e-wom.items",
    "canonicalId": "zRsqUAEjUGsDcmvb",
    "sourceDescription": "<p>A lattice of <em>Hysh</em> overlays your mind, allowing you to think rapidly. Gain +20 to Intelligence and Initiative.</p><p><strong>Lore:</strong> You may inflict one @Condition[Blinded] Condition on those targeted by Lore of Light spells, unless they possess the Arcane Magic (Light) Talent. If a target has the @UUID[Compendium.wfrp4e-core.items.v3uzEthcq0JRar0J]{Daemonic} or @UUID[Compendium.wfrp4e-core.items.PFTD9gDvRWW9uh5g]{Undead} Creature Traits, spells also inflict an additional hit with Damage equal to your Intelligence Bonus that ignores Toughness Bonus and Armor Points.</p><p></p>",
    "guardFields": {
      "system.range.value": "You",
      "system.target.value": "You",
      "system.duration.value": "Willpower Bonus rounds",
      "system.damage.value": "",
      "system.lore.value": "light",
      "system.cn.value": 8,
      "system.characteristic.value": null,
      "system.grouped.value": null,
      "system.tests.value": null,
      "system.special.value": null
    },
    "sourceScripts": []
  },
  "wfrp4e-core.items.tNWrJUOArwfWXsPw": {
    "name": "Ethereal",
    "type": "trait",
    "pack": "wfrp4e-core.items",
    "canonicalId": "tNWrJUOArwfWXsPw",
    "sourceDescription": "<p>The creature’s form is insubstantial, allowing it to pass through solid objects. It can only be harmed by Magical attacks.</p>",
    "guardFields": {
      "system.range.value": null,
      "system.target.value": null,
      "system.duration.value": null,
      "system.damage.value": null,
      "system.lore.value": null,
      "system.cn.value": null,
      "system.characteristic.value": null,
      "system.grouped.value": null,
      "system.tests.value": null,
      "system.special.value": null
    },
    "sourceScripts": [
      [
        "preTakeDamage",
        "[Script.jObJanFoev4N6ZRv]",
        {
          "dialog": {
            "hideScript": "",
            "activateScript": "",
            "submissionScript": "",
            "targeter": false
          },
          "immediate": {
            "deleteEffect": false
          },
          "hideScript": "",
          "activateScript": "",
          "submissionScript": "",
          "targeter": false,
          "deleteEffect": false
        }
      ]
    ]
  },
  "wfrp4e-wom.items.gQMyhwx2FiTesYm3": {
    "name": "Caress of Laniph",
    "type": "spell",
    "pack": "wfrp4e-wom.items",
    "canonicalId": "gQMyhwx2FiTesYm3",
    "sourceDescription": "<p>As you reach out your hand, it appears withered, even skeletal, drawing <em>Shyish</em> from your target’s corpus. This counts as a <em>magic missile</em> with a Damage of +6 that ignores Toughness Bonus and Armour Points. For every 2 Wounds you inflict with this spell, you may recover 1 Wound up to your maximum Wounds.</p><p><strong>Lore:</strong> Targets afflicted by spells from the Lore of Death are drained of life, enervated, and listless. You may assign +1 @Condition[Fatigued] Condition to any living target affected by a spell from this lore. A target may only ever have a single Fatigued Condition gained in this manner at any one time.</p><p></p>",
    "guardFields": {
      "system.range.value": "Touch",
      "system.target.value": "Special",
      "system.duration.value": "Instant",
      "system.damage.value": "6",
      "system.lore.value": "death",
      "system.cn.value": 4,
      "system.characteristic.value": null,
      "system.grouped.value": null,
      "system.tests.value": null,
      "system.special.value": null
    },
    "sourceScripts": [
      [
        "applyDamage",
        "[Script.hCzxUyO6mjLNIpaM]",
        {
          "dialog": {
            "hideScript": "",
            "activateScript": "",
            "submissionScript": "",
            "targeter": false
          },
          "immediate": {
            "deleteEffect": false
          },
          "hideScript": "",
          "activateScript": "",
          "submissionScript": "",
          "targeter": false,
          "deleteEffect": false
        }
      ],
      [
        "preApplyDamage",
        "[Script.QbIYnshWeP1U8SUy]",
        {
          "dialog": {
            "hideScript": "",
            "activateScript": "",
            "submissionScript": "",
            "targeter": false
          },
          "immediate": {
            "deleteEffect": false
          },
          "hideScript": "",
          "activateScript": "",
          "submissionScript": "",
          "targeter": false,
          "deleteEffect": false
        }
      ]
    ]
  },
  "wfrp4e-wom.items.hyCKFlFXQ1lLbOUy": {
    "name": "Dying Words",
    "type": "spell",
    "pack": "wfrp4e-wom.items",
    "canonicalId": "hyCKFlFXQ1lLbOUy",
    "sourceDescription": "<p>Touching the body of a recently departed soul (one that passed away within the last day), you call its soul back briefly. For the spell’s duration, you can communicate with the dead soul, though it cannot take any action other than talking. It is not compelled to answer you, but the dead do not lie. </p><p>\n\n <b>Lore:</b> Targets afflicted by spells from the Lore of Death are drained of life, enervated, and listless. You may assign +1 @Condition[Fatigued] Condition to any living target affected by a spell from this lore. A target may only ever have a single Fatigued Condition gained in this manner at any one time.<p>",
    "guardFields": {
      "system.range.value": "Touch",
      "system.target.value": "1",
      "system.duration.value": "Willpower Bonus rounds",
      "system.damage.value": "",
      "system.lore.value": "death",
      "system.cn.value": 6,
      "system.characteristic.value": null,
      "system.grouped.value": null,
      "system.tests.value": null,
      "system.special.value": null
    },
    "sourceScripts": []
  },
  "wfrp4e-wom.items.dKuL6ki8MBtYw7Lr": {
    "name": "Purple Pall of Shyish",
    "type": "spell",
    "pack": "wfrp4e-wom.items",
    "canonicalId": "dKuL6ki8MBtYw7Lr",
    "sourceDescription": "<p>You pull about you a pall fashioned from fine strands of Shyish. Gain +Willpower Bonus Armour Points on all locations, and the @UUID[Compendium.wfrp4e-core.items.pTorrE0l3VybAbtn]{Fear (1)} Creature Trait. For every +2 SL you may increase your Fear rating by 1.</p><p><strong>Lore:</strong> Targets afflicted by spells from the Lore of Death are drained of life, enervated, and listless. You may assign +1 @Condition[Fatigued] Condition to any living target affected by a spell from this lore. A target may only ever have a single Fatigued Condition gained in this manner at any one time.</p><p></p>",
    "guardFields": {
      "system.range.value": "You",
      "system.target.value": "You",
      "system.duration.value": "Willpower Bonus rounds",
      "system.damage.value": "",
      "system.lore.value": "death",
      "system.cn.value": 9,
      "system.characteristic.value": null,
      "system.grouped.value": null,
      "system.tests.value": null,
      "system.special.value": null
    },
    "sourceScripts": [
      [
        "prepareData",
        "[Script.8WJsecxdndaHRxxS]",
        {
          "dialog": {
            "hideScript": "",
            "activateScript": "",
            "submissionScript": "",
            "targeter": false
          },
          "immediate": {
            "deleteEffect": false
          },
          "hideScript": "",
          "activateScript": "",
          "submissionScript": "",
          "targeter": false,
          "deleteEffect": false
        }
      ],
      [
        "addItems",
        "[Script.SLy1Fs3oXcHgFgjK]",
        {
          "dialog": {
            "hideScript": "",
            "activateScript": "",
            "submissionScript": "",
            "targeter": false
          },
          "immediate": {
            "deleteEffect": false
          },
          "hideScript": "",
          "activateScript": "",
          "submissionScript": "",
          "targeter": false,
          "deleteEffect": false
        }
      ]
    ]
  },
  "wfrp4e-wom.items.q6ihU4N0zoCONt5p": {
    "name": "Sanctify",
    "type": "spell",
    "pack": "wfrp4e-wom.items",
    "canonicalId": "q6ihU4N0zoCONt5p",
    "sourceDescription": "<p>Inscribing a magical circle, you ward it with <em>Shyish</em>, forming an impenetrable barrier to the Undead. Creatures with the @UUID[Compendium.wfrp4e-core.items.PFTD9gDvRWW9uh5g]{Undead} Creature Trait cannot enter or leave the circle.</p><p><strong>Lore:</strong> Targets afflicted by spells from the Lore of Death are drained of life, enervated, and listless. You may assign +1 @Condition[Fatigued] Condition to any living target affected by a spell from this lore. A target may only ever have a single Fatigued Condition gained in this manner at any one time.</p><p></p>",
    "guardFields": {
      "system.range.value": "Touch",
      "system.target.value": "Willpower Bonus yards",
      "system.duration.value": "Willpower minutes",
      "system.damage.value": "",
      "system.lore.value": "death",
      "system.cn.value": 10,
      "system.characteristic.value": null,
      "system.grouped.value": null,
      "system.tests.value": null,
      "system.special.value": null
    },
    "sourceScripts": [
      [
        "immediate",
        "[Script.1exiWlVUHsXDLLAH]",
        {
          "dialog": {
            "hideScript": "",
            "activateScript": "",
            "submissionScript": "",
            "targeter": false
          },
          "immediate": {
            "deleteEffect": false
          },
          "hideScript": "",
          "activateScript": "",
          "submissionScript": "",
          "targeter": false,
          "deleteEffect": false
        }
      ]
    ]
  },
  "wfrp4e-wom.items.df7Yma8YKMfyCpAI": {
    "name": "Scythe of Shyish",
    "type": "spell",
    "pack": "wfrp4e-wom.items",
    "canonicalId": "df7Yma8YKMfyCpAI",
    "sourceDescription": "<p>You conjure a magical scythe, which can be wielded in combat using the Melee (Polearm) Skill. It acts like a Halberd with a Damage equal to your Willpower Bonus + 3. Enemies with the Undead Creature Trait do not receive Advantage when Engaged in combat with you. </p><p>\n\n <b>Lore:</b> Targets afflicted by spells from the Lore of Death are drained of life, enervated, and listless. You may assign +1 @Condition[Fatigued] Condition to any living target affected by a spell from this lore. A target may only ever have a single Fatigued Condition gained in this manner at any one time.<p>",
    "guardFields": {
      "system.range.value": "You",
      "system.target.value": "You",
      "system.duration.value": "Willpower Bonus rounds",
      "system.damage.value": "",
      "system.lore.value": "death",
      "system.cn.value": 6,
      "system.characteristic.value": null,
      "system.grouped.value": null,
      "system.tests.value": null,
      "system.special.value": null
    },
    "sourceScripts": [
      [
        "addItems",
        "[Script.xBpLQa7yBPczDMY8]",
        {
          "dialog": {
            "hideScript": "",
            "activateScript": "",
            "submissionScript": "",
            "targeter": false
          },
          "immediate": {
            "deleteEffect": false
          },
          "hideScript": "",
          "activateScript": "",
          "submissionScript": "",
          "targeter": false,
          "deleteEffect": false
        }
      ]
    ]
  },
  "wfrp4e-wom.items.L9REVIvgyr8cwu9D": {
    "name": "Soul Vortex",
    "type": "spell",
    "pack": "wfrp4e-wom.items",
    "canonicalId": "L9REVIvgyr8cwu9D",
    "sourceDescription": "<p>You hurl a shimmering ball of Shyish which erupts into purple flames, swirling with ghostly faces, mouths agape in silent terror. Targets within the Area of Effect receive +1 @Condition[Broken] Condition. Targets with the @UUID[Compendium.wfrp4e-core.items.PFTD9gDvRWW9uh5g]{Undead} Creature Trait, take a <em>magic missile</em> hit with a Damage of +10 that ignores Toughness Bonus and Armour Points.</p><p><strong>Lore:</strong> Targets afflicted by spells from the Lore of Death are drained of life, enervated, and listless. You may assign +1 @Condition[Fatigued] Condition to any living target affected by a spell from this lore. A target may only ever have a single Fatigued Condition gained in this manner at any one time.</p><p></p>",
    "guardFields": {
      "system.range.value": "Willpower yards",
      "system.target.value": "Willpower Bonus yards",
      "system.duration.value": "Instant",
      "system.damage.value": "10",
      "system.lore.value": "death",
      "system.cn.value": 8,
      "system.characteristic.value": null,
      "system.grouped.value": null,
      "system.tests.value": null,
      "system.special.value": null
    },
    "sourceScripts": [
      [
        "immediate",
        "[Script.oGdsGPgJWcyWkiWl]",
        {
          "dialog": {
            "hideScript": "",
            "activateScript": "",
            "submissionScript": "",
            "targeter": false
          },
          "immediate": {
            "deleteEffect": false
          },
          "hideScript": "",
          "activateScript": "",
          "submissionScript": "",
          "targeter": false,
          "deleteEffect": false
        }
      ]
    ]
  },
  "wfrp4e-wom.items.nkz8tu3CfZMxy3s3": {
    "name": "Steal Life",
    "type": "spell",
    "pack": "wfrp4e-wom.items",
    "canonicalId": "nkz8tu3CfZMxy3s3",
    "sourceDescription": "<p>Thin strands of purple mist connect you briefly to your target, who wastes away before your very eyes. This counts as a magic missile with a Damage of +6 that ignores Armour Points and inflicts 1 @Condition[Fatigued] Condition. </p><p>Furthermore, you remove all @Condition[Fatigued] Conditions you currently suffer, and may heal yourself up to half the Wounds the target suffers, rounding up. </p><p>\n\n <b>Lore:</b> Targets afflicted by spells from the Lore of Death are drained of life, enervated, and listless. You may assign +1 @Condition[Fatigued] Condition to any living target affected by a spell from this lore. A target may only ever have a single Fatigued Condition gained in this manner at any one time.<p>",
    "guardFields": {
      "system.range.value": "Willpower yards",
      "system.target.value": "1",
      "system.duration.value": "Instant",
      "system.damage.value": "6",
      "system.lore.value": "death",
      "system.cn.value": 7,
      "system.characteristic.value": null,
      "system.grouped.value": null,
      "system.tests.value": null,
      "system.special.value": null
    },
    "sourceScripts": [
      [
        "applyDamage",
        "[Script.jFwema0iwzBphxie]",
        {
          "dialog": {
            "hideScript": "",
            "activateScript": "",
            "submissionScript": "",
            "targeter": false
          },
          "immediate": {
            "deleteEffect": false
          },
          "hideScript": "",
          "activateScript": "",
          "submissionScript": "",
          "targeter": false,
          "deleteEffect": false
        }
      ],
      [
        "preApplyDamage",
        "[Script.KyswmGj1uG3QS3ng]",
        {
          "dialog": {
            "hideScript": "",
            "activateScript": "",
            "submissionScript": "",
            "targeter": false
          },
          "immediate": {
            "deleteEffect": false
          },
          "hideScript": "",
          "activateScript": "",
          "submissionScript": "",
          "targeter": false,
          "deleteEffect": false
        }
      ]
    ]
  },
  "wfrp4e-wom.items.MVakHk8RZTmSYfBj": {
    "name": "Swift Passing",
    "type": "spell",
    "pack": "wfrp4e-wom.items",
    "canonicalId": "MVakHk8RZTmSYfBj",
    "sourceDescription": "<p>Your touch brings the release of death to a single mortally wounded target. If you successfully touch a target with 0 Wounds remaining and at least 2 Critical Wounds, death swiftly follows. Furthermore, the target cannot be raised as Undead.</p><p><strong>Lore:</strong> Targets afflicted by spells from the Lore of Death are drained of life, enervated, and listless. You may assign +1 @Condition[Fatigued] Condition to any living target affected by a spell from this lore. A target may only ever have a single Fatigued Condition gained in this manner at any one time.</p><p></p>",
    "guardFields": {
      "system.range.value": "Touch",
      "system.target.value": "Special",
      "system.duration.value": "Instant",
      "system.damage.value": "",
      "system.lore.value": "death",
      "system.cn.value": 6,
      "system.characteristic.value": null,
      "system.grouped.value": null,
      "system.tests.value": null,
      "system.special.value": null
    },
    "sourceScripts": []
  },
  "wfrp4e-wom.items.UYcCoPIU04pVkO2o": {
    "name": "Amber Talons",
    "type": "spell",
    "pack": "wfrp4e-wom.items",
    "canonicalId": "UYcCoPIU04pVkO2o",
    "sourceDescription": "<p>Your nails grow into wickedly sharp talons of crystal amber. Your unarmed attacks are magical, have a Damage equal to SL plus your Strength Bonus plus your Willpower Bonus, and inflict 1 @Condition[Bleeding] Condition whenever they cause a loss of Wounds. </p><p>\n\n <b>Lore:</b> Whenever you successfully cast a spell from the Lore of Beasts, you may also gain the @UUID[Compendium.wfrp4e-core.items.pTorrE0l3VybAbtn]{Fear (1)} Creature Trait for the next [[/r 1d10]] Rounds.<p>",
    "guardFields": {
      "system.range.value": "You",
      "system.target.value": "You",
      "system.duration.value": "Willpower Bonus rounds",
      "system.damage.value": "",
      "system.lore.value": "beasts",
      "system.cn.value": 6,
      "system.characteristic.value": null,
      "system.grouped.value": null,
      "system.tests.value": null,
      "system.special.value": null
    },
    "sourceScripts": [
      [
        "addItems",
        "[Script.g4t56A09yrpZaJQ2]",
        {
          "dialog": {
            "hideScript": "",
            "activateScript": "",
            "submissionScript": "",
            "targeter": false
          },
          "immediate": {
            "deleteEffect": false
          },
          "hideScript": "",
          "activateScript": "",
          "submissionScript": "",
          "targeter": false,
          "deleteEffect": false
        }
      ]
    ]
  },
  "wfrp4e-wom.items.g02T9V227kpUDpB3": {
    "name": "Beast Form",
    "type": "spell",
    "pack": "wfrp4e-wom.items",
    "canonicalId": "g02T9V227kpUDpB3",
    "sourceDescription": "<p>You infuse your very bones and flesh with <em>Ghur</em>, warping your body into that of a creature. When cast, select a new form from any of the @UUID[Compendium.wfrp4e-core.journals.3ZynTGhFpgwv6l1n.JournalEntryPage.ahM2hOJnyXcSKrdS]{Beasts of the Reikland} section of the Bestiary. You gain all the creature’s standard Traits except the @UUID[Compendium.wfrp4e-core.items.AGcJl5rHjkyIQBPP]{Bestial} Trait. Furthermore, replace your Movement, Strength, Toughness, Agility, and Dexterity with the creature’s. Recalculate your Wounds. For every +2 SL, you may include 1 of the creature’s Optional Creature Traits.</p><p>While in <em>Beast Form</em>, you look like a normal version of the creature, with amber and brown colouring. You may not speak, cast spells, or attempt to dispel. If you have lost any Wounds when the spell ends, you lose the same number of Wounds when you revert to your true form. You cannot be reduced below 0 Wounds in this way.</p><p><strong>Lore:</strong> Whenever you successfully cast a spell from the Lore of Beasts, you may also gain the @UUID[Compendium.wfrp4e-core.items.pTorrE0l3VybAbtn]{Fear (1)} Creature Trait for the next [[/r 1d10]] Rounds.</p><p></p>",
    "guardFields": {
      "system.range.value": "You",
      "system.target.value": "You",
      "system.duration.value": "Willpower minutes",
      "system.damage.value": "",
      "system.lore.value": "beasts",
      "system.cn.value": 5,
      "system.characteristic.value": null,
      "system.grouped.value": null,
      "system.tests.value": null,
      "system.special.value": null
    },
    "sourceScripts": []
  },
  "wfrp4e-wom.items.B4TLSxssFpyOQtoW": {
    "name": "Beast Master",
    "type": "spell",
    "pack": "wfrp4e-wom.items",
    "canonicalId": "B4TLSxssFpyOQtoW",
    "sourceDescription": "<p>Your breath steams and your eyes take on a shining amber sheen as Ghur suffuses you. Your gaze and words convince 1 creature of with the @UUID[Compendium.wfrp4e-core.items.AGcJl5rHjkyIQBPP]{Bestial} and @UUID[Compendium.wfrp4e-core.items.8slW8CJ2oVTxeQ6q]{Size (Small, Average, or Large)} Traits that you are its pack master. It fights to the death to protect you. While subject to your mastery the beast follows your commands, instinctively understanding simple instructions. If the spell ends, the creature retains enough respect and fear not to attack you unless compelled to. Your allies may not be so fortunate.</p><p><strong>Lore:</strong> Whenever you successfully cast a spell from the Lore of Beasts, you may also gain the @UUID[Compendium.wfrp4e-core.items.pTorrE0l3VybAbtn]{Fear (1)} Creature Trait for the next [[/r 1d10]] Rounds.</p><p></p>",
    "guardFields": {
      "system.range.value": "Willpower Bonus yards",
      "system.target.value": "1",
      "system.duration.value": "Willpower Bonus days",
      "system.damage.value": "",
      "system.lore.value": "beasts",
      "system.cn.value": 10,
      "system.characteristic.value": null,
      "system.grouped.value": null,
      "system.tests.value": null,
      "system.special.value": null
    },
    "sourceScripts": []
  },
  "wfrp4e-wom.items.IiG20D4K0390omQl": {
    "name": "Wyssan’s Wildform",
    "type": "spell",
    "pack": "wfrp4e-wom.items",
    "canonicalId": "IiG20D4K0390omQl",
    "sourceDescription": "<p>You call on the wild power of Ghur to infuse you, surrendering to its savage delights. You gain the following Creature Traits: @UUID[Compendium.wfrp4e-core.items.rOV2s6PQBBrhpMOv]{Arboreal}, @UUID[Compendium.wfrp4e-core.items.VUJUZVN3VYhOaPjj]{Armour (2)}, @UUID[Compendium.wfrp4e-core.items.GbDyBCu8ZjDp6dkj]{Belligerent}, @UUID[Compendium.wfrp4e-core.items.a8MC97PLzl10WocT]{Big}, @UUID[Compendium.wfrp4e-core.items.pLW9SVX0TVTYPiPv]{Bite (Strength Bonus +1)}, @UUID[Compendium.wfrp4e-core.items.pTorrE0l3VybAbtn]{Fear (1)}, @UUID[Compendium.wfrp4e-core.items.fjd1u9VAgiYzhBRp]{Fury}, @UUID[Compendium.wfrp4e-core.items.mDgEMOoJpi8DkRYb]{Magical}, @UUID[Compendium.wfrp4e-core.items.AtpAudHA4ybXVlWM]{Weapon (Strength Bonus +2)}. While the spell is in effect, you are incapable of using any Language or Lore Skills.</p><p><strong>Lore:</strong> Whenever you successfully cast a spell from the Lore of Beasts, you may also gain the @UUID[Compendium.wfrp4e-core.items.pTorrE0l3VybAbtn]{Fear (1)} Creature Trait for the next [[/r 1d10]] Rounds.</p><p></p>",
    "guardFields": {
      "system.range.value": "You",
      "system.target.value": "You",
      "system.duration.value": "Willpower Bonus rounds",
      "system.damage.value": "",
      "system.lore.value": "beasts",
      "system.cn.value": 8,
      "system.characteristic.value": null,
      "system.grouped.value": null,
      "system.tests.value": null,
      "system.special.value": null
    },
    "sourceScripts": [
      [
        "addItems",
        "[Script.XRrGBbplNLZpXnCH]",
        {
          "dialog": {
            "hideScript": "",
            "activateScript": "",
            "submissionScript": "",
            "targeter": false
          },
          "immediate": {
            "deleteEffect": false
          },
          "hideScript": "",
          "activateScript": "",
          "submissionScript": "",
          "targeter": false,
          "deleteEffect": false
        }
      ]
    ]
  },
  "wfrp4e-core.items.9CAkY3SQjQxRTlNJ": {
    "name": "Roughrider",
    "type": "talent",
    "pack": "wfrp4e-core.items",
    "canonicalId": "9CAkY3SQjQxRTlNJ",
    "sourceDescription": "<p>You are at home in the saddle in even the most difficult of circumstances, and know how to get the best out of your mount during conﬂict. Assuming you have the Ride skill, you can direct your mount to take an Action, not just a Move, without a Ride test.</p>",
    "guardFields": {
      "system.range.value": null,
      "system.target.value": null,
      "system.duration.value": null,
      "system.damage.value": null,
      "system.lore.value": null,
      "system.cn.value": null,
      "system.characteristic.value": null,
      "system.grouped.value": null,
      "system.tests.value": "Ride (Horse) when in combat",
      "system.special.value": null
    },
    "sourceScripts": [
      [
        "dialog",
        "[Script.956dUb5sd6OtbWZR]",
        {
          "dialog": {
            "hideScript": "[Script.w4JKuTECFmu3YmTR]",
            "activateScript": "[Script.FXuyiJoXdAh6WhRK]",
            "submissionScript": "",
            "targeter": false
          },
          "immediate": {
            "deleteEffect": false
          },
          "hideScript": "[Script.w4JKuTECFmu3YmTR]",
          "activateScript": "[Script.FXuyiJoXdAh6WhRK]",
          "submissionScript": "",
          "targeter": false,
          "deleteEffect": false
        }
      ]
    ]
  },
  "wfrp4e-core.items.qTVOlj1aU6776dep": {
    "name": "Choking Shadows",
    "type": "spell",
    "pack": "wfrp4e-core.items",
    "canonicalId": "qTVOlj1aU6776dep",
    "sourceDescription": "<p>You wrap shadowy tendrils of <em>Ulgu</em> around your foes’ necks. Assuming they need to breathe, they gain +1 @Condition[Fatigued] Condition, cannot talk, and are subject to rules for @UUID[Compendium.wfrp4e-core.journals.NS3YGlJQxwTggjRX.JournalEntryPage.WCivInLZrqEtZzF4#drowning-and-suffocation]{Suffocation}.</p><p><strong>Lore:</strong> All spells cast from the Lore of Shadows inﬂicting Damage ignore all non-magical Armor Points.</p><p></p>",
    "guardFields": {
      "system.range.value": "Willpower Bonus yards",
      "system.target.value": "1",
      "system.duration.value": "Willpower Bonus Rounds",
      "system.damage.value": "",
      "system.lore.value": "shadow",
      "system.cn.value": 6,
      "system.characteristic.value": null,
      "system.grouped.value": null,
      "system.tests.value": null,
      "system.special.value": null
    },
    "sourceScripts": [
      [
        "immediate",
        "[Script.JwgFQmPQtXWAP94i]",
        {
          "dialog": {
            "hideScript": "",
            "activateScript": "",
            "submissionScript": "",
            "targeter": false
          },
          "immediate": {
            "deleteEffect": true
          },
          "hideScript": "",
          "activateScript": "",
          "submissionScript": "",
          "targeter": false,
          "deleteEffect": true
        }
      ]
    ]
  },
  "wfrp4e-core.items.OwH4hpe1EReh06t3": {
    "name": "Illusion",
    "type": "spell",
    "pack": "wfrp4e-core.items",
    "canonicalId": "OwH4hpe1EReh06t3",
    "sourceDescription": "<p>You spin a web of intricate strands of <em>Ulgu</em>, obfuscating the Area of Effect with an illusory image of your choosing. You will automatically fool anyone without the @UUID[Compendium.wfrp4e-core.items.OEjUvJKi0xmBwbS2]{Second Sight}&nbsp;Talent. Those with that Talent must pass a <strong>Difficult (–10) Perception</strong> Test to notice the illusion. This does not let them see through the spell. They must dispel it to do so. The illusion is, by default, static. For your Action, you may make a <strong>Hard (–20) Channeling</strong> Test to make the illusion move for that Round.</p><p>\n\n <b>Lore:</b> All spells cast from the Lore of Shadows inﬂicting Damage ignore all non-magical Armor Points.<p>",
    "guardFields": {
      "system.range.value": "Willpower yards",
      "system.target.value": "Initiative Bonus yards",
      "system.duration.value": "Willpower minutes",
      "system.damage.value": "",
      "system.lore.value": "shadow",
      "system.cn.value": 8,
      "system.characteristic.value": null,
      "system.grouped.value": null,
      "system.tests.value": null,
      "system.special.value": null
    },
    "sourceScripts": []
  },
  "wfrp4e-core.items.Tv9BIBNTPT6JV0HG": {
    "name": "Mystifying Miasma",
    "type": "spell",
    "pack": "wfrp4e-core.items",
    "canonicalId": "Tv9BIBNTPT6JV0HG",
    "sourceDescription": "<p>You conjure forth a swirling mass of mist shot through with roiling shadow that ﬂits and confounds the senses. Anyone within the mist who does not possess the <em>Arcane Magic (Shadows)</em> Talent is affected by the Miasma, gaining +1 @Condition[Blinded], @Condition[Deafened], and @Condition[Fatigued] Condition, which remain for the spell&rsquo;s duration. Anyone affected attempting to move must pass a <strong>Challenging (+0) Perception</strong> Test, or gain the @Condition[Prone]<em> </em>Condition. If the spell is dispelled once in play, anyone affected by the spell must make a <strong>Routine (+40) Initiative</strong> Test, or gain the @Condition[Stunned] Condition.</p><p>\n\n <b>Lore:</b> All spells cast from the Lore of Shadows inﬂicting Damage ignore all non-magical Armor Points.<p>",
    "guardFields": {
      "system.range.value": "Willpower yards",
      "system.target.value": "Willpower Bonus yards",
      "system.duration.value": "Willpower Bonus Rounds",
      "system.damage.value": "",
      "system.lore.value": "shadow",
      "system.cn.value": 6,
      "system.characteristic.value": null,
      "system.grouped.value": null,
      "system.tests.value": null,
      "system.special.value": null
    },
    "sourceScripts": [
      [
        "immediate",
        "[Script.jYJRO5XPyG7y6fih]",
        {
          "dialog": {
            "hideScript": "",
            "activateScript": "",
            "submissionScript": "",
            "targeter": false
          },
          "immediate": {
            "deleteEffect": false
          },
          "hideScript": "",
          "activateScript": "",
          "submissionScript": "",
          "targeter": false,
          "deleteEffect": false
        }
      ],
      [
        "deleteEffect",
        "[Script.a7pEvCycVnFBXGAQ]",
        {
          "dialog": {
            "hideScript": "",
            "activateScript": "",
            "submissionScript": "",
            "targeter": false
          },
          "immediate": {
            "deleteEffect": false
          },
          "hideScript": "",
          "activateScript": "",
          "submissionScript": "",
          "targeter": false,
          "deleteEffect": false
        }
      ]
    ]
  },
  "wfrp4e-core.items.kJNAY1YRaCy9IgmT": {
    "name": "Terror",
    "type": "trait",
    "pack": "wfrp4e-core.items",
    "canonicalId": "kJNAY1YRaCy9IgmT",
    "sourceDescription": "<p>Some creatures are so profoundly unsettling as to provoke a dire, bone-chilling terror in their foes. When you first encounter a creature causing Terror, make a Cool Test. If you pass, you suffer no further effects of Terror; if you fail, you receive a number of Broken conditions equal to the creature&rsquo;s Terror Rating, plus the number of SL below 0.</p>\n<p>After resolving the Psychology Test, the creature causes @UUID[Compendium.wfrp4e-core.items.pTorrE0l3VybAbtn]{Fear}, with a Fear Rating equal to its Terror Rating.</p>",
    "guardFields": {
      "system.range.value": null,
      "system.target.value": null,
      "system.duration.value": null,
      "system.damage.value": null,
      "system.lore.value": null,
      "system.cn.value": null,
      "system.characteristic.value": null,
      "system.grouped.value": null,
      "system.tests.value": null,
      "system.special.value": null
    },
    "sourceScripts": [
      [
        "manual",
        "[Script.MFKhU9vp8bQpHP3I]",
        {}
      ]
    ]
  },
  "wfrp4e-wom.items.kquC0bXzt9OHHF2M": {
    "name": "Spell Syphon",
    "type": "trait",
    "pack": "wfrp4e-wom.items",
    "canonicalId": "kquC0bXzt9OHHF2M",
    "sourceDescription": "<p>Whenever an enemy successfully casts a spell or uses a magic item to cast a spell, the Blue Scribes can make an Opposed Willpower Test with the caster. If they prevail, roll 1d10 and consult the @Table[spell-syphon]{Spell Syphon Table}</p><p>When the Blue Scribes succeed in a Spell Syphon contest of wills (a roll of 3–10) on the table above, the spellcaster must roll an additional <strong>Very Hard (–30) Cool</strong> Test. If they fail, they gain the @Condition[Unconscious] Condition for [[/r 1d10]] hours and acquire 2 Corruption points.</p>",
    "guardFields": {
      "system.range.value": null,
      "system.target.value": null,
      "system.duration.value": null,
      "system.damage.value": null,
      "system.lore.value": null,
      "system.cn.value": null,
      "system.characteristic.value": null,
      "system.grouped.value": null,
      "system.tests.value": null,
      "system.special.value": null
    },
    "sourceScripts": []
  },
  "wfrp4e-wom.items.b5cRCQDhnUBYKQA4": {
    "name": "Cerulean Shield",
    "type": "spell",
    "pack": "wfrp4e-wom.items",
    "canonicalId": "b5cRCQDhnUBYKQA4",
    "sourceDescription": "<p>You encase yourself in a crackling cage of sparking electricity and Azyr. For the spell’s duration, gain +SL Armour Points to all locations against melee attacks. If attacked by metal weapons — such as daggers, swords, and spears with metal tips — your attacker takes your Willpower Bonus in Damage (this Damage is reduced by TB, but not by Armour). </p><p>\n\n <b>Lore:</b> Spells causing Damage ignore Armour Points from metal armour, and will arc to all other targets within 2 yards, except those with the Arcane Magic (Heavens) Talent, inflicting hits with a Damage equal to your Willpower Bonus, handled like a magical missile.<p>",
    "guardFields": {
      "system.range.value": "You",
      "system.target.value": "You",
      "system.duration.value": "Willpower Bonus rounds",
      "system.damage.value": "",
      "system.lore.value": "heavens",
      "system.cn.value": 7,
      "system.characteristic.value": null,
      "system.grouped.value": null,
      "system.tests.value": null,
      "system.special.value": null
    },
    "sourceScripts": [
      [
        "computeTakeDamageModifiers",
        "[Script.NnA4zpuO6iUXKhH7]",
        {
          "dialog": {
            "hideScript": "",
            "activateScript": "",
            "submissionScript": "",
            "targeter": false
          },
          "immediate": {
            "deleteEffect": false
          },
          "hideScript": "",
          "activateScript": "",
          "submissionScript": "",
          "targeter": false,
          "deleteEffect": false
        }
      ],
      [
        "preTakeDamage",
        "[Script.Cjj4iLkdY1NaZRCi]",
        {
          "dialog": {
            "hideScript": "",
            "activateScript": "",
            "submissionScript": "",
            "targeter": false
          },
          "immediate": {
            "deleteEffect": false
          },
          "hideScript": "",
          "activateScript": "",
          "submissionScript": "",
          "targeter": false,
          "deleteEffect": false
        }
      ]
    ]
  },
  "wfrp4e-wom.items.ag975kP2t5zYWmSu": {
    "name": "Comet of Casandora",
    "type": "spell",
    "pack": "wfrp4e-wom.items",
    "canonicalId": "ag975kP2t5zYWmSu",
    "sourceDescription": "<p>You channel all the Azyr you can muster and reach out to the skies, calling down a comet to wreak havoc amongst your foes. Select a target point within range. At the end of the next round, make an <strong>Average (+20) Perception</strong> Test.</p><p>For every +SL you achieve on the Perception Test, you may move your point of impact by Initiative Bonus yards. For every –SL, the GM moves the point of impact by Initiative Bonus yards in a random direction. Comet of Casandora then acts as a <em>magic missile</em> with Damage +12 that hits all targets in the Area of Effect. Targets also gain 1 @Condition[Ablaze] Condition and the @Condition[Prone] Condition.</p><p><strong>Lore:</strong> Spells causing Damage ignore Armour Points from metal armour, and will arc to all other targets within 2 yards, except those with the Arcane Magic (Heavens) Talent, inflicting hits with a Damage equal to your Willpower Bonus, handled like a magical missile.</p><p></p>",
    "guardFields": {
      "system.range.value": "Initiative yards",
      "system.target.value": "Initiative Bonus yards",
      "system.duration.value": "Special",
      "system.damage.value": "12",
      "system.lore.value": "heavens",
      "system.cn.value": 10,
      "system.characteristic.value": null,
      "system.grouped.value": null,
      "system.tests.value": null,
      "system.special.value": null
    },
    "sourceScripts": [
      [
        "applyDamage",
        "[Script.3tE8gFSl28EhCmo5]",
        {
          "dialog": {
            "hideScript": "",
            "activateScript": "",
            "submissionScript": "",
            "targeter": false
          },
          "immediate": {
            "deleteEffect": false
          },
          "hideScript": "",
          "activateScript": "",
          "submissionScript": "",
          "targeter": false,
          "deleteEffect": false
        }
      ]
    ]
  },
  "wfrp4e-wom.items.vN4DZ4uZDTNpHyr9": {
    "name": "Fate’s Fickle Fingers",
    "type": "spell",
    "pack": "wfrp4e-wom.items",
    "canonicalId": "vN4DZ4uZDTNpHyr9",
    "sourceDescription": "<p>All allies within the Area of Effect, excluding those with the <em>Arcane Magic (Heavens)</em> Talent, create a single pool of Fortune points. All may draw on the pool; first come, first served. When the spell ends, you reallocate any remaining Fortune points as fairly as possible.</p><p><strong>Lore:</strong> Spells causing Damage ignore Armour Points from metal armour, and will arc to all other targets within 2 yards, except those with the Arcane Magic (Heavens) Talent, inflicting hits with a Damage equal to your Willpower Bonus, handled like a magical missile.</p><p></p>",
    "guardFields": {
      "system.range.value": "You",
      "system.target.value": "Initiative Bonus yards",
      "system.duration.value": "Willpower Bonus rounds",
      "system.damage.value": "",
      "system.lore.value": "heavens",
      "system.cn.value": 6,
      "system.characteristic.value": null,
      "system.grouped.value": null,
      "system.tests.value": null,
      "system.special.value": null
    },
    "sourceScripts": []
  },
  "wfrp4e-wom.items.OUlPM5woG08xN0KR": {
    "name": "Starcrossed",
    "type": "spell",
    "pack": "wfrp4e-wom.items",
    "canonicalId": "OUlPM5woG08xN0KR",
    "sourceDescription": "<p>While this spell is active, you can spend Fortune points to force an opponent to reroll Tests. </p><p>\n\n <b>Lore:</b> Spells causing Damage ignore Armour Points from metal armour, and will arc to all other targets within 2 yards, except those with the Arcane Magic (Heavens) Talent, inflicting hits with a Damage equal to your Willpower Bonus, handled like a magical missile.<p>",
    "guardFields": {
      "system.range.value": "Willpower yards",
      "system.target.value": "1",
      "system.duration.value": "Initiative Bonus rounds",
      "system.damage.value": "",
      "system.lore.value": "heavens",
      "system.cn.value": 7,
      "system.characteristic.value": null,
      "system.grouped.value": null,
      "system.tests.value": null,
      "system.special.value": null
    },
    "sourceScripts": []
  },
  "wfrp4e-wom.items.iko8Jn6OlB7kJgaR": {
    "name": "Crown of Flame",
    "type": "spell",
    "pack": "wfrp4e-wom.items",
    "canonicalId": "iko8Jn6OlB7kJgaR",
    "sourceDescription": "<p>You channel Aqshy into a majestic crown of inspiring fire about your brow. You gain the @UUID[Compendium.wfrp4e-core.items.pTorrE0l3VybAbtn]{Fear (1)} Trait and @UUID[Compendium.wfrp4e-core.items.vCgEAetBMngR53aT]{War Leader} Talent  while the spell is active. For every +2 SL on your Casting Test, you may increase your Fear value by 1 or take the War Leader Talent again. Furthermore, gain a +10 bonus on all Channelling and Casting Tests using Aqshy while the spell is in effect.</p><p><strong>Lore:</strong> You may inflict +1 @Condition[Ablaze] Condition on anyone targeted by spells from the Lore of Fire, unless they also possess the Arcane Magic (Fire) Talent. Every Ablaze condition within Willpower Bonus yards adds +10 to attempts to Channel or Cast with Aqshy.</p><p></p>",
    "guardFields": {
      "system.range.value": "You",
      "system.target.value": "You",
      "system.duration.value": "Willpower Bonus rounds",
      "system.damage.value": "",
      "system.lore.value": "fire",
      "system.cn.value": 8,
      "system.characteristic.value": null,
      "system.grouped.value": null,
      "system.tests.value": null,
      "system.special.value": null
    },
    "sourceScripts": [
      [
        "dialog",
        "[Script.Xu5cED1MhT4ba7da]",
        {
          "dialog": {
            "activateScript": "[Script.IKiZv9YSFmKmHo6a]",
            "hideScript": "[Script.XYaYeiVkc5GKYTjC]",
            "submissionScript": "",
            "targeter": false
          },
          "immediate": {
            "deleteEffect": false
          },
          "activateScript": "[Script.IKiZv9YSFmKmHo6a]",
          "hideScript": "[Script.XYaYeiVkc5GKYTjC]",
          "submissionScript": "",
          "targeter": false,
          "deleteEffect": false
        }
      ],
      [
        "addItems",
        "[Script.qK4q4o6cQhcGzFX3]",
        {
          "dialog": {
            "hideScript": "",
            "activateScript": "",
            "submissionScript": "",
            "targeter": false
          },
          "immediate": {
            "deleteEffect": false
          },
          "hideScript": "",
          "activateScript": "",
          "submissionScript": "",
          "targeter": false,
          "deleteEffect": false
        }
      ]
    ]
  },
  "wfrp4e-wom.items.ENArNiMo17J67RYt": {
    "name": "Barkskin",
    "type": "spell",
    "pack": "wfrp4e-wom.items",
    "canonicalId": "ENArNiMo17J67RYt",
    "sourceDescription": "<p>You cause the target’s skin to become hard and rough like the bark of a tree. While affected by the spell, add +2 to the target’s Toughness Bonus, but suffer –10 to Agility and Dexterity.</p><p>\n\n <b>Lore:</b> Receive a +10 bonus to Casting and Channeling rolls when in a rural or wilderness environment. Living creatures — e.g. those without the @UUID[Compendium.wfrp4e-core.items.v3uzEthcq0JRar0J]{Daemonic} or @UUID[Compendium.wfrp4e-core.items.PFTD9gDvRWW9uh5g]{Undead} Creature Traits — targeted by Arcane Spells from the Lore of Life have all @Condition[Fatigued] and @Condition[Bleeding] Conditions removed after any other effects have been applied as life magic floods through them. Creatures with the @UUID[Compendium.wfrp4e-core.items.PFTD9gDvRWW9uh5g]{Undead} Creature Trait, on the other hand, suffer additional Damage equal to your Willpower Bonus, ignoring Toughness Bonus and Armor Points, if affected by any spell cast with the Lore of Life.<p>",
    "guardFields": {
      "system.range.value": "Touch",
      "system.target.value": "1",
      "system.duration.value": "Willpower Bonus rounds",
      "system.damage.value": "",
      "system.lore.value": "life",
      "system.cn.value": 3,
      "system.characteristic.value": null,
      "system.grouped.value": null,
      "system.tests.value": null,
      "system.special.value": null
    },
    "sourceScripts": []
  },
  "wfrp4e-wom.items.3hbEzGb4DkggqjBZ": {
    "name": "Forest of Thorns",
    "type": "spell",
    "pack": "wfrp4e-wom.items",
    "canonicalId": "3hbEzGb4DkggqjBZ",
    "sourceDescription": "<p>This spell may only target a patch of earth. You cause a dense knot of wickedly spiked brambles and tangled vines to burst upwards, covering the Area of Effect. While the spell is active, anyone without the <em>Arcane Magic (Life)</em> Talent attempting to traverse the area on foot must make a <strong>Hard (–20) Agility</strong> Test. If the target fails, they gain 1 @Condition[Bleeding] Condition and 1 @Condition[Entangled] Condition with a Strength equal to your Willpower. After the spell ends, the growth remains but loses its magical properties.</p><p><strong>Lore:</strong> Receive a +10 bonus to Casting and Channeling rolls when in a rural or wilderness environment. Living creatures — e.g. those without the @UUID[Compendium.wfrp4e-core.items.v3uzEthcq0JRar0J]{Daemonic} or @UUID[Compendium.wfrp4e-core.items.PFTD9gDvRWW9uh5g]{Undead} Creature Traits — targeted by Arcane Spells from the Lore of Life have all @Condition[Fatigued] and @Condition[Bleeding] Conditions removed after any other effects have been applied as life magic floods through them. Creatures with the @UUID[Compendium.wfrp4e-core.items.PFTD9gDvRWW9uh5g]{Undead} Creature Trait, on the other hand, suffer additional Damage equal to your Willpower Bonus, ignoring Toughness Bonus and Armor Points, if affected by any spell cast with the Lore of Life.</p><p></p>",
    "guardFields": {
      "system.range.value": "Willpower yards",
      "system.target.value": "Willpower Bonus yards",
      "system.duration.value": "Willpower Bonus rounds",
      "system.damage.value": "",
      "system.lore.value": "life",
      "system.cn.value": 6,
      "system.characteristic.value": null,
      "system.grouped.value": null,
      "system.tests.value": null,
      "system.special.value": null
    },
    "sourceScripts": [
      [
        "immediate",
        "[Script.bwtQOSWn120NICkf]",
        {
          "dialog": {
            "hideScript": "",
            "activateScript": "",
            "submissionScript": "",
            "targeter": false
          },
          "immediate": {
            "deleteEffect": false
          },
          "hideScript": "",
          "activateScript": "",
          "submissionScript": "",
          "targeter": false,
          "deleteEffect": false
        }
      ]
    ]
  },
  "wfrp4e-wom.items.uUZ3GmvnbjGe1KV9": {
    "name": "Lifebloom",
    "type": "spell",
    "pack": "wfrp4e-wom.items",
    "canonicalId": "uUZ3GmvnbjGe1KV9",
    "sourceDescription": "<p>You cause <em>Ghyran</em> to flood an area that is blighted or desolate. As examples of the spell’s power you may target either a dry riverbed, well, field, or a domestic animal. If you successfully cast the spell, the target bursts to life:</p><ul><li><p>A dry river begins to flow once again.</p></li><li><p>A dry or polluted well becomes clean and fresh.</p></li><li><p>A planted field, vineyard, or orchard bursts into life, with all its crops immediately reaching full ripeness.</p></li><li><p>A sick or unproductive animal is cured of all diseases and becomes energetic and eager once more.</p></li></ul><p><strong>Lore:</strong> Receive a +10 bonus to Casting and Channeling rolls when in a rural or wilderness environment. Living creatures — e.g. those without the @UUID[Compendium.wfrp4e-core.items.v3uzEthcq0JRar0J]{Daemonic} or @UUID[Compendium.wfrp4e-core.items.PFTD9gDvRWW9uh5g]{Undead} Creature Traits — targeted by Arcane Spells from the Lore of Life have all @Condition[Fatigued] and @Condition[Bleeding] Conditions removed after any other effects have been applied as life magic floods through them. Creatures with the @UUID[Compendium.wfrp4e-core.items.PFTD9gDvRWW9uh5g]{Undead} Creature Trait, on the other hand, suffer additional Damage equal to your Willpower Bonus, ignoring Toughness Bonus and Armor Points, if affected by any spell cast with the Lore of Life.</p><p></p>",
    "guardFields": {
      "system.range.value": "Willpower Bonus yards",
      "system.target.value": "Special",
      "system.duration.value": "Special",
      "system.damage.value": "",
      "system.lore.value": "life",
      "system.cn.value": 8,
      "system.characteristic.value": null,
      "system.grouped.value": null,
      "system.tests.value": null,
      "system.special.value": null
    },
    "sourceScripts": []
  },
  "wfrp4e-wom.items.0mxgFrKibU945H0K": {
    "name": "Random Caster",
    "type": "trait",
    "pack": "wfrp4e-wom.items",
    "canonicalId": "0mxgFrKibU945H0K",
    "sourceDescription": "<p>@UUID[Compendium.wfrp4e-wom.actors.xtMKRZwrbINYGph2]{Xirat’p} can cast spells at random. When they are attacked, roll on the following table once per round to determine which kind of spell they cast. Having chosen the lore randomly, either choose the spell or generate randomly. More spells from the @UUID[Compendium.wfrp4e-eis.journals.IZVgB7zmTm4rK2yJ.JournalEntryPage.6aHizetwTRbkMZ7W#the-lore-of-tzeentch]{Lore of Tzeentch} can be found in the <strong>Enemy in Shadows Companion</strong> and the <strong>Death on the Reik Companion</strong>; and more spells from the @UUID[Compendium.wfrp4e-pbtt.journals.gX4TCKy0TPwS68ba.JournalEntryPage.MOIADJ2A0ZOzDGEp]{Lore of Slaanesh} are in the <strong>Power Behind the Throne Companion</strong>.</p><p>@Table[random-caster]{Random Caster}</p>",
    "guardFields": {
      "system.range.value": null,
      "system.target.value": null,
      "system.duration.value": null,
      "system.damage.value": null,
      "system.lore.value": null,
      "system.cn.value": null,
      "system.characteristic.value": null,
      "system.grouped.value": null,
      "system.tests.value": null,
      "system.special.value": null
    },
    "sourceScripts": [
      [
        "manual",
        "[Script.ULmZMLezDamerN04]",
        {
          "dialog": {
            "hideScript": "",
            "activateScript": "",
            "submissionScript": "",
            "targeter": false
          },
          "immediate": {
            "deleteEffect": false
          },
          "hideScript": "",
          "activateScript": "",
          "submissionScript": "",
          "targeter": false,
          "deleteEffect": false
        }
      ]
    ]
  },
  "wfrp4e-core.items.zZUX7wO4rOo8k9F0:verified-native-YI3BIzcGfU6reh8g": {
    "name": "Navigation",
    "type": "skill",
    "pack": "wfrp4e-core.items",
    "canonicalId": "zZUX7wO4rOo8k9F0",
    "sourceDescription": "<p>@Embed[Compendium.wfrp4e-core.journals.JournalEntry.6zOdTLv3YeYeJ4hR.JournalEntryPage.rf7gtZko4KJvjFaE caption=false]{Navigation}",
    "guardFields": {
      "system.range.value": null,
      "system.target.value": null,
      "system.duration.value": null,
      "system.damage.value": null,
      "system.lore.value": null,
      "system.cn.value": null,
      "system.characteristic.value": "i",
      "system.grouped.value": "noSpec",
      "system.tests.value": null,
      "system.special.value": null
    },
    "sourceScripts": []
  },
  "wfrp4e-core.items.Fs06sr7y9JKpVQmB:verified-native-dGwA7fzNLw9ls0eT": {
    "name": "Perception",
    "type": "skill",
    "pack": "wfrp4e-core.items",
    "canonicalId": "Fs06sr7y9JKpVQmB",
    "sourceDescription": "<p>@Embed[Compendium.wfrp4e-core.journals.JournalEntry.6zOdTLv3YeYeJ4hR.JournalEntryPage.6Jhks0zDRpJeN6dW caption=false]{Perception}",
    "guardFields": {
      "system.range.value": null,
      "system.target.value": null,
      "system.duration.value": null,
      "system.damage.value": null,
      "system.lore.value": null,
      "system.cn.value": null,
      "system.characteristic.value": "i",
      "system.grouped.value": "noSpec",
      "system.tests.value": null,
      "system.special.value": null
    },
    "sourceScripts": []
  },
  "wfrp4e-core.items.sRuMlaPU5xdIrwhd:verified-native-IkcUAJpN3iE255rn": {
    "name": "Climb",
    "type": "skill",
    "pack": "wfrp4e-core.items",
    "canonicalId": "sRuMlaPU5xdIrwhd",
    "sourceDescription": "<p>@Embed[Compendium.wfrp4e-core.journals.JournalEntry.6zOdTLv3YeYeJ4hR.JournalEntryPage.yOONKSIBrg4FOl20 caption=false]{Climb}",
    "guardFields": {
      "system.range.value": null,
      "system.target.value": null,
      "system.duration.value": null,
      "system.damage.value": null,
      "system.lore.value": null,
      "system.cn.value": null,
      "system.characteristic.value": "s",
      "system.grouped.value": "noSpec",
      "system.tests.value": null,
      "system.special.value": null
    },
    "sourceScripts": []
  },
  "wfrp4e-wom.items.foZedAFB3TQpU0SJ:verified-native-XR4NI16geEtGhYyx": {
    "name": "Telepathy",
    "type": "spell",
    "pack": "wfrp4e-wom.items",
    "canonicalId": "foZedAFB3TQpU0SJ",
    "sourceDescription": "<p>Using the spirit-plane, you send a telepathic message to another Amethyst wizard. The Animus Imprisoned spell removes range limitations. Attempts to communicate with other characters are difficult. Characters who receive a telepathic message must pass a <strong>Challenging (+0) Intuition</strong> Test to understand the message.</p><p>Alternatively, this spell can be used to read the surface thoughts of another Amethyst Wizard. The target can make a <strong>Challenging (+0) Intelligence</strong> Test to notice the attempt, and if detected, can attempt an Opposed Willpower Test to block your intrusion.</p><p>\n\n <b>Lore:</b> Targets afflicted by spells from the Lore of Death are drained of life, enervated, and listless. You may assign +1 @Condition[Fatigued] Condition to any living target affected by a spell from this lore. A target may only ever have a single Fatigued Condition gained in this manner at any one time.<p>",
    "guardFields": {
      "system.range.value": "100 yards",
      "system.target.value": "1",
      "system.duration.value": "Instant",
      "system.damage.value": "",
      "system.lore.value": "death",
      "system.cn.value": 1,
      "system.characteristic.value": null,
      "system.grouped.value": null,
      "system.tests.value": null,
      "system.special.value": null
    },
    "sourceScripts": []
  },
  "wfrp4e-wom.items.YoyD7AC2GcyuVUUj:verified-native-z5GrcCOaKdERpci2": {
    "name": "Shaman Lord",
    "type": "career",
    "pack": "wfrp4e-wom.items",
    "canonicalId": "YoyD7AC2GcyuVUUj",
    "sourceDescription": "",
    "guardFields": {
      "system.range.value": null,
      "system.target.value": null,
      "system.duration.value": null,
      "system.damage.value": null,
      "system.lore.value": null,
      "system.cn.value": null,
      "system.characteristic.value": null,
      "system.grouped.value": null,
      "system.tests.value": null,
      "system.special.value": null,
      "system.class.value": "Academics",
      "system.careergroup.value": "Shaman",
      "system.status.tier": "g",
      "system.status.standing": 2
    },
    "sourceScripts": [],
    "guardCollections": {
      "system.skills": [
        "Animal Care",
        "Channelling (Ghur)",
        "Cool",
        "Dodge",
        "Intuition",
        "Language (Magick)",
        "Lore (Magic)",
        "Melee (Polearm)",
        "Outdoor Survival",
        "Perception",
        "Animal Training (Any)",
        "Charm Animal",
        "Lore (Beasts)",
        "Ranged (Bow)",
        "Stealth (Rural)",
        "Track",
        "Navigation",
        "Research",
        "Ride (Horse)",
        "Secret Signs (Amber Order)",
        "Lore (Any)",
        "Leadership"
      ],
      "system.talents": [
        "Frightening",
        "Iron Will",
        "Lightning Reflexes",
        "War Wizard"
      ],
      "system.trappings": [
        "Conclave of Shamans",
        "Elaborate Robes",
        "Shamanic Lair"
      ],
      "system.characteristics": [
        "ws",
        "int",
        "wp",
        "ag",
        "i",
        "t"
      ],
      "system.incomeSkill": [
        5
      ]
    }
  },
  "wfrp4e-wom.items.QMEeB4BonCjEsedj:verified-native-c7Y1Yt1IdwuZtqen": {
    "name": "Net of Amyntok",
    "type": "spell",
    "pack": "wfrp4e-wom.items",
    "canonicalId": "QMEeB4BonCjEsedj",
    "sourceDescription": "<p>You cast a delicate net woven from strands of Hysh over your targets, whose minds are overcome with conundrums and puzzles, leaving them paralysed with indecision. Targets gain +1 @Condition[Stunned] Condition, which they cannot lose while the spell is in effect. When recovering from the Condition, targets Test their Intelligence instead of the Endurance Skill. Targets with the @UUID[Compendium.wfrp4e-core.items.AGcJl5rHjkyIQBPP]{Bestial} Creature Trait are immune to this spell.</p><p><strong>Lore:</strong> You may inflict one @Condition[Blinded] Condition on those targeted by Lore of Light spells, unless they possess the Arcane Magic (Light) Talent. If a target has the @UUID[Compendium.wfrp4e-core.items.v3uzEthcq0JRar0J]{Daemonic} or @UUID[Compendium.wfrp4e-core.items.PFTD9gDvRWW9uh5g]{Undead} Creature Traits, spells also inflict an additional hit with Damage equal to your Intelligence Bonus that ignores Toughness Bonus and Armor Points.</p><p></p>",
    "guardFields": {
      "system.range.value": "Intelligence Bonus yards",
      "system.target.value": "1",
      "system.duration.value": "Target’s Intelligence Bonus rounds",
      "system.damage.value": "",
      "system.lore.value": "light",
      "system.cn.value": 8,
      "system.characteristic.value": null,
      "system.grouped.value": null,
      "system.tests.value": null,
      "system.special.value": null
    },
    "sourceScripts": [
      [
        "immediate",
        "[Script.V7qmFwUMCY2tfziH]",
        {
          "dialog": {
            "hideScript": "",
            "activateScript": "",
            "submissionScript": "",
            "targeter": false
          },
          "immediate": {
            "deleteEffect": false
          },
          "hideScript": "",
          "activateScript": "",
          "submissionScript": "",
          "targeter": false,
          "deleteEffect": false
        }
      ]
    ]
  },
  "wfrp4e-wom.items.7cuV5Zsu5jeeBpXF:verified-native-Ic8pTQE9uBfgOSVu": {
    "name": "Beast Tongue",
    "type": "spell",
    "pack": "wfrp4e-wom.items",
    "canonicalId": "7cuV5Zsu5jeeBpXF",
    "sourceDescription": "<p>You can commune with all creatures possessing the @UUID[Compendium.wfrp4e-core.items.AGcJl5rHjkyIQBPP]{Bestial} Trait. <em>Ghur</em> clogs your throat, and your language comes out as snarls, hisses, and roars as befits the beasts to whom you speak. While the creatures are not compelled to answer you or do as you bid, most hear you out. You gain +20 on all Charm Animal and Animal Training Tests. While this spell is active, you may only speak with beasts — you may not speak any civilised tongues and can only communicate with your party using gestures or Language (Battle). You cannot cast spells or dispel while Beast Tongue is active.</p><p><strong>Lore:</strong> Whenever you successfully cast a spell from the Lore of Beasts, you may also gain the @UUID[Compendium.wfrp4e-core.items.pTorrE0l3VybAbtn]{Fear (1)} Creature Trait for the next [[/r 1d10]] Rounds.</p><p></p>",
    "guardFields": {
      "system.range.value": "You",
      "system.target.value": "You",
      "system.duration.value": "Willpower minutes",
      "system.damage.value": "",
      "system.lore.value": "beasts",
      "system.cn.value": 3,
      "system.characteristic.value": null,
      "system.grouped.value": null,
      "system.tests.value": null,
      "system.special.value": null
    },
    "sourceScripts": [
      [
        "dialog",
        "[Script.9ZFPDCk8M2TQxh7x]",
        {
          "dialog": {
            "activateScript": "[Script.LeKLtvEDrWh4yHsx]",
            "hideScript": "[Script.3hfMQkUKYI4rCuBy]",
            "submissionScript": "",
            "targeter": false
          },
          "immediate": {
            "deleteEffect": false
          },
          "activateScript": "[Script.LeKLtvEDrWh4yHsx]",
          "hideScript": "[Script.3hfMQkUKYI4rCuBy]",
          "submissionScript": "",
          "targeter": false,
          "deleteEffect": false
        }
      ]
    ]
  },
  "wfrp4e-wom.items.8p5d7p50m9GBuLQV:verified-native-7cBe8ivatozoVM26": {
    "name": "Firewall",
    "type": "spell",
    "pack": "wfrp4e-wom.items",
    "canonicalId": "8p5d7p50m9GBuLQV",
    "sourceDescription": "<p>You channel a streak of Aqshy, creating a wall of flame. The Firewall is Willpower Bonus yards wide and 1 yard deep. For every +2 SL on your Casting Test you may extend the length by Willpower Bonus yards. Anyone crossing the firewall gains 1 @Condition[Ablaze] Condition and suffers a <em>magic missile</em> hit with a Damage equal to your Willpower Bonus.</p><p><strong>Lore:</strong> You may inflict +1 @Condition[Ablaze] Condition on anyone targeted by spells from the Lore of Fire, unless they also possess the Arcane Magic (Fire) Talent. Every Ablaze condition within Willpower Bonus yards adds +10 to attempts to Channel or Cast with Aqshy.</p><p></p>",
    "guardFields": {
      "system.range.value": "Willpower yards",
      "system.target.value": "AoE (Special)",
      "system.duration.value": "Willpower Bonus rounds",
      "system.damage.value": "Willpower Bonus",
      "system.lore.value": "fire",
      "system.cn.value": 6,
      "system.characteristic.value": null,
      "system.grouped.value": null,
      "system.tests.value": null,
      "system.special.value": null
    },
    "sourceScripts": [
      [
        "immediate",
        "[Script.xRTmMwNfdirjsi8X]",
        {
          "dialog": {
            "hideScript": "",
            "activateScript": "",
            "submissionScript": "",
            "targeter": false
          },
          "immediate": {
            "deleteEffect": true
          },
          "hideScript": "",
          "activateScript": "",
          "submissionScript": "",
          "targeter": false,
          "deleteEffect": true
        }
      ]
    ]
  }
});
const ORIGINS = Object.freeze({
  "Compendium.wfrp4e-wom.actors.Actor.JrH67vCaUXSF7YQq.Item.3RFk70PNjcw2N3Zc": "wfrp4e-core.items.Fs06sr7y9JKpVQmB",
  "Compendium.wfrp4e-wom.actors.Actor.JrH67vCaUXSF7YQq.Item.0hYql2Lm10Qt9PG4": "wfrp4e-core.items.sRuMlaPU5xdIrwhd",
  "Compendium.wfrp4e-wom.actors.Actor.JrH67vCaUXSF7YQq.Item.y7aPGWXcFqXt64ta": "wfrp4e-core.items.zZUX7wO4rOo8k9F0",
  "Compendium.wfrp4e-wom.actors.Actor.JrH67vCaUXSF7YQq.Item.utqALEGaFfcPbC2k": "wfrp4e-wom.items.lVAAphWi2iP40ccJ",
  "Compendium.wfrp4e-wom.actors.Actor.JrH67vCaUXSF7YQq.Item.CmFQrDqtpd8tOfaj": "wfrp4e-wom.items.3s0l2R7dplULuMtl",
  "Compendium.wfrp4e-wom.actors.Actor.9u5V79gIzWHDLWqH.Item.TgBonQgBHpp27LIN": "wfrp4e-core.items.Fs06sr7y9JKpVQmB",
  "Compendium.wfrp4e-wom.actors.Actor.9u5V79gIzWHDLWqH.Item.bLrYbKNdQaTeFNsa": "wfrp4e-wom.items.5ZBlXMHlrdIlaDr1",
  "Compendium.wfrp4e-wom.actors.Actor.9u5V79gIzWHDLWqH.Item.IN7M4Rk1Mv8RmAlT": "wfrp4e-core.items.sRuMlaPU5xdIrwhd",
  "Compendium.wfrp4e-wom.actors.Actor.9u5V79gIzWHDLWqH.Item.Yk3hPxX1N58daWxH": "wfrp4e-core.items.zZUX7wO4rOo8k9F0",
  "Compendium.wfrp4e-wom.actors.Actor.9u5V79gIzWHDLWqH.Item.70cMZuxM6Z9rVMdG": "wfrp4e-wom.items.2yWwf7T1zUnDIocS",
  "Compendium.wfrp4e-wom.actors.Actor.9u5V79gIzWHDLWqH.Item.NYx7KPs7Hrq3H8Aa": "wfrp4e-wom.items.SpDC6uiVUE2C08NS",
  "Compendium.wfrp4e-wom.actors.Actor.9u5V79gIzWHDLWqH.Item.2izl51gjCjiyOVOW": "wfrp4e-wom.items.WarJYR6TpkVwfuCv",
  "Compendium.wfrp4e-wom.actors.Actor.9u5V79gIzWHDLWqH.Item.bJU9Jz1lVpMAiMK3": "wfrp4e-wom.items.a5ugjb2n4i1ZkeUf",
  "Compendium.wfrp4e-wom.actors.Actor.9u5V79gIzWHDLWqH.Item.q4zyI2HQThCa0WxO": "wfrp4e-wom.items.2FHU23a3IQ1mQG7c",
  "Compendium.wfrp4e-wom.actors.Actor.33wOqP0s7ANviU1e.Item.lEge1YqR52rT3cr8": "wfrp4e-core.items.sRuMlaPU5xdIrwhd",
  "Compendium.wfrp4e-wom.actors.Actor.33wOqP0s7ANviU1e.Item.CZ0RNCQyWca15Qc3": "wfrp4e-core.items.Fs06sr7y9JKpVQmB",
  "Compendium.wfrp4e-wom.actors.Actor.33wOqP0s7ANviU1e.Item.Wi0H4xduZAO0h9ad": "wfrp4e-core.items.qZ4cFy6z482ZONuA",
  "Compendium.wfrp4e-wom.actors.Actor.33wOqP0s7ANviU1e.Item.PpixBVogOEhgCOj2": "wfrp4e-core.items.mDgEMOoJpi8DkRYb",
  "Compendium.wfrp4e-wom.actors.Actor.33wOqP0s7ANviU1e.Item.a6xS99MhHWXlkYEZ": "wfrp4e-core.items.039vRQ8jv5cY3P4o",
  "Compendium.wfrp4e-wom.actors.Actor.33wOqP0s7ANviU1e.Item.bFnWlnEaD27R8b3W": "wfrp4e-core.items.ahlxlfIl8xUhBkic",
  "Compendium.wfrp4e-wom.actors.Actor.OtBqhr035Qdf3XNo.Item.lUmvCDtIMb7A6M6N": "wfrp4e-core.items.Fs06sr7y9JKpVQmB",
  "Compendium.wfrp4e-wom.actors.Actor.OtBqhr035Qdf3XNo.Item.sN7fWKUSCz2pK0yi": "wfrp4e-wom.items.pL6Sczx1q3yOmgMn",
  "Compendium.wfrp4e-wom.actors.Actor.OtBqhr035Qdf3XNo.Item.UK9trznIB1vH5GrJ": "wfrp4e-wom.items.3ANa4WjBEh5BGI2W",
  "Compendium.wfrp4e-wom.actors.Actor.OtBqhr035Qdf3XNo.Item.Y0Lh5UqLgeR7oGiM": "wfrp4e-wom.items.zRsqUAEjUGsDcmvb",
  "Compendium.wfrp4e-wom.actors.Actor.oldtgeL8W8JqlmMA.Item.FZmy0AN1kOJ3vV9w": "wfrp4e-core.items.Fs06sr7y9JKpVQmB",
  "Compendium.wfrp4e-wom.actors.Actor.oldtgeL8W8JqlmMA.Item.UJRAv1UDPmn0JqE6": "wfrp4e-core.items.tNWrJUOArwfWXsPw",
  "Compendium.wfrp4e-wom.actors.Actor.oldtgeL8W8JqlmMA.Item.HJVfM7pcysRH4Qzz": "wfrp4e-core.items.sRuMlaPU5xdIrwhd",
  "Compendium.wfrp4e-wom.actors.Actor.oldtgeL8W8JqlmMA.Item.cen1Z0JGGtv6jyn3": "wfrp4e-core.items.zZUX7wO4rOo8k9F0",
  "Compendium.wfrp4e-wom.actors.Actor.oldtgeL8W8JqlmMA.Item.3Lyv0w2L9RfofbrZ": "wfrp4e-wom.items.gQMyhwx2FiTesYm3",
  "Compendium.wfrp4e-wom.actors.Actor.oldtgeL8W8JqlmMA.Item.vXWZ42EtyG9Wnia7": "wfrp4e-wom.items.hyCKFlFXQ1lLbOUy",
  "Compendium.wfrp4e-wom.actors.Actor.oldtgeL8W8JqlmMA.Item.vzxcw8IJnapmClYt": "wfrp4e-wom.items.dKuL6ki8MBtYw7Lr",
  "Compendium.wfrp4e-wom.actors.Actor.oldtgeL8W8JqlmMA.Item.Qr7dymSg6uYNkwCD": "wfrp4e-wom.items.q6ihU4N0zoCONt5p",
  "Compendium.wfrp4e-wom.actors.Actor.oldtgeL8W8JqlmMA.Item.91AXsOkgHcs8Eg3b": "wfrp4e-wom.items.df7Yma8YKMfyCpAI",
  "Compendium.wfrp4e-wom.actors.Actor.oldtgeL8W8JqlmMA.Item.opC3tfJRpKLSzUbo": "wfrp4e-wom.items.L9REVIvgyr8cwu9D",
  "Compendium.wfrp4e-wom.actors.Actor.oldtgeL8W8JqlmMA.Item.fWx4jUjW5FE4xY82": "wfrp4e-wom.items.nkz8tu3CfZMxy3s3",
  "Compendium.wfrp4e-wom.actors.Actor.oldtgeL8W8JqlmMA.Item.YoBNsKJWhP3X9EpP": "wfrp4e-wom.items.MVakHk8RZTmSYfBj",
  "Compendium.wfrp4e-wom.actors.Actor.vErRQ0QEVapPSdkM.Item.nwRhofGpsMxIAuvQ": "wfrp4e-core.items.Fs06sr7y9JKpVQmB",
  "Compendium.wfrp4e-wom.actors.Actor.vErRQ0QEVapPSdkM.Item.YhFHgPQFnpRLsJgZ": "wfrp4e-core.items.qZ4cFy6z482ZONuA",
  "Compendium.wfrp4e-wom.actors.Actor.vErRQ0QEVapPSdkM.Item.5qC2Ks9tNPCJoLPo": "wfrp4e-core.items.sRuMlaPU5xdIrwhd",
  "Compendium.wfrp4e-wom.actors.Actor.vErRQ0QEVapPSdkM.Item.y3Lerl2DRynSUw0V": "wfrp4e-core.items.zZUX7wO4rOo8k9F0",
  "Compendium.wfrp4e-wom.actors.Actor.vErRQ0QEVapPSdkM.Item.QyA6LNvVaxZhswg8": "wfrp4e-wom.items.UYcCoPIU04pVkO2o",
  "Compendium.wfrp4e-wom.actors.Actor.vErRQ0QEVapPSdkM.Item.Yay2bKt7hbafXeQD": "wfrp4e-wom.items.g02T9V227kpUDpB3",
  "Compendium.wfrp4e-wom.actors.Actor.vErRQ0QEVapPSdkM.Item.bTX11BVFIHbtlrFR": "wfrp4e-wom.items.B4TLSxssFpyOQtoW",
  "Compendium.wfrp4e-wom.actors.Actor.vErRQ0QEVapPSdkM.Item.IIw6NsqXtWWop1iy": "wfrp4e-wom.items.IiG20D4K0390omQl",
  "Compendium.wfrp4e-wom.actors.Actor.1Fw8roY9zezj0jAn.Item.h9b78nUmnbiRXI9h": "wfrp4e-core.items.9CAkY3SQjQxRTlNJ",
  "Compendium.wfrp4e-wom.actors.Actor.1Fw8roY9zezj0jAn.Item.wguo0c3O0blCyWj9": "wfrp4e-core.items.qTVOlj1aU6776dep",
  "Compendium.wfrp4e-wom.actors.Actor.1Fw8roY9zezj0jAn.Item.JItCjhLlWyrMu8Ry": "wfrp4e-core.items.OwH4hpe1EReh06t3",
  "Compendium.wfrp4e-wom.actors.Actor.1Fw8roY9zezj0jAn.Item.Y0ihj0IGxCSB2D51": "wfrp4e-core.items.Tv9BIBNTPT6JV0HG",
  "Compendium.wfrp4e-wom.actors.Actor.vAIvEmLRcPjg5GOv.Item.ydbhMMqseiAVPaj3": "wfrp4e-core.items.kJNAY1YRaCy9IgmT",
  "Compendium.wfrp4e-wom.actors.Actor.2ODxoEtEl6ZMzE0j.Item.s0WcV00hfbsQHH9K": "wfrp4e-core.items.kJNAY1YRaCy9IgmT",
  "Compendium.wfrp4e-wom.actors.Actor.8Ct3OotoGRqV4nkd.Item.1TK2IIlQlLKUubYd": "wfrp4e-core.items.kJNAY1YRaCy9IgmT",
  "Compendium.wfrp4e-wom.actors.Actor.kjfBuKJKt3u3sQQz.Item.BgPsS3NFuFsSN0Lf": "wfrp4e-core.items.Fs06sr7y9JKpVQmB",
  "Compendium.wfrp4e-wom.actors.Actor.5c8TPGmO1Wx2zu9z.Item.mJJPK0HVbTPplOrP": "wfrp4e-core.items.Fs06sr7y9JKpVQmB",
  "Compendium.wfrp4e-wom.actors.Actor.5c8TPGmO1Wx2zu9z.Item.Dg0wAus3HCopWRiN": "wfrp4e-core.items.mDgEMOoJpi8DkRYb",
  "Compendium.wfrp4e-wom.actors.Actor.5c8TPGmO1Wx2zu9z.Item.g6NPDSmaXhUXHkgB": "wfrp4e-core.items.ahlxlfIl8xUhBkic",
  "Compendium.wfrp4e-wom.actors.Actor.A3CyaqarDZyEET5k.Item.gTDJHIb9Jl5s1Kil": "wfrp4e-wom.items.kquC0bXzt9OHHF2M",
  "Compendium.wfrp4e-wom.actors.Actor.06edHNTIJFOTKH9w.Item.7j83WzNMqJDs6nWS": "wfrp4e-core.items.zZUX7wO4rOo8k9F0",
  "Compendium.wfrp4e-wom.actors.Actor.06edHNTIJFOTKH9w.Item.HGJwUZRLW5t61F1D": "wfrp4e-core.items.Fs06sr7y9JKpVQmB",
  "Compendium.wfrp4e-wom.actors.Actor.06edHNTIJFOTKH9w.Item.QhHbupDwFhoztQyr": "wfrp4e-core.items.sRuMlaPU5xdIrwhd",
  "Compendium.wfrp4e-wom.actors.Actor.06edHNTIJFOTKH9w.Item.oyhRdeMlOJLVPzrr": "wfrp4e-wom.items.b5cRCQDhnUBYKQA4",
  "Compendium.wfrp4e-wom.actors.Actor.06edHNTIJFOTKH9w.Item.eVH8DMmVCHfekIAo": "wfrp4e-wom.items.ag975kP2t5zYWmSu",
  "Compendium.wfrp4e-wom.actors.Actor.06edHNTIJFOTKH9w.Item.OVy7PBgzb3dPP7Ip": "wfrp4e-wom.items.vN4DZ4uZDTNpHyr9",
  "Compendium.wfrp4e-wom.actors.Actor.06edHNTIJFOTKH9w.Item.BUVzWpBAmmXczw6Z": "wfrp4e-wom.items.OUlPM5woG08xN0KR",
  "Compendium.wfrp4e-wom.actors.Actor.u2tiVh3bjxz8pBxb.Item.7FQKX2slc7Kv9mSR": "wfrp4e-core.items.Fs06sr7y9JKpVQmB",
  "Compendium.wfrp4e-wom.actors.Actor.u2tiVh3bjxz8pBxb.Item.vb7xsmvt18nFF7mX": "wfrp4e-core.items.sRuMlaPU5xdIrwhd",
  "Compendium.wfrp4e-wom.actors.Actor.u2tiVh3bjxz8pBxb.Item.GdTRncZ4nzI5IiW8": "wfrp4e-core.items.zZUX7wO4rOo8k9F0",
  "Compendium.wfrp4e-wom.actors.Actor.u2tiVh3bjxz8pBxb.Item.RbesV2EiXxD0AzoE": "wfrp4e-wom.items.iko8Jn6OlB7kJgaR",
  "Compendium.wfrp4e-wom.actors.Actor.SljLp1V7fW2QR7PW.Item.dgiyxeQDQgSKi6hi": "wfrp4e-core.items.Fs06sr7y9JKpVQmB",
  "Compendium.wfrp4e-wom.actors.Actor.SljLp1V7fW2QR7PW.Item.W1m3ZNY9QFQu8H1t": "wfrp4e-core.items.mDgEMOoJpi8DkRYb",
  "Compendium.wfrp4e-wom.actors.Actor.SljLp1V7fW2QR7PW.Item.3B8gbqOQoZNJH8W5": "wfrp4e-core.items.ahlxlfIl8xUhBkic",
  "Compendium.wfrp4e-wom.actors.Actor.47AVLmEhgioAt7O3.Item.qd6wYAzpJM4fIvjx": "wfrp4e-core.items.zZUX7wO4rOo8k9F0",
  "Compendium.wfrp4e-wom.actors.Actor.47AVLmEhgioAt7O3.Item.eLh8qhQMWx2YopBp": "wfrp4e-core.items.Fs06sr7y9JKpVQmB",
  "Compendium.wfrp4e-wom.actors.Actor.47AVLmEhgioAt7O3.Item.DQ5k4CxhufPjwzGt": "wfrp4e-core.items.sRuMlaPU5xdIrwhd",
  "Compendium.wfrp4e-wom.actors.Actor.47AVLmEhgioAt7O3.Item.Cr0RHD5JGlGcv6s2": "wfrp4e-wom.items.ENArNiMo17J67RYt",
  "Compendium.wfrp4e-wom.actors.Actor.47AVLmEhgioAt7O3.Item.LffeSSWjly4g8QVG": "wfrp4e-wom.items.3hbEzGb4DkggqjBZ",
  "Compendium.wfrp4e-wom.actors.Actor.47AVLmEhgioAt7O3.Item.8tzdinxGeunP0zO6": "wfrp4e-wom.items.uUZ3GmvnbjGe1KV9",
  "Compendium.wfrp4e-wom.actors.Actor.xtMKRZwrbINYGph2.Item.xpLfXnQOSGxq2NjY": "wfrp4e-wom.items.0mxgFrKibU945H0K",
  "Compendium.wfrp4e-wom.actors.Actor.1Fw8roY9zezj0jAn.Item.YI3BIzcGfU6reh8g": "wfrp4e-core.items.zZUX7wO4rOo8k9F0:verified-native-YI3BIzcGfU6reh8g",
  "Compendium.wfrp4e-wom.actors.Actor.1Fw8roY9zezj0jAn.Item.dGwA7fzNLw9ls0eT": "wfrp4e-core.items.Fs06sr7y9JKpVQmB:verified-native-dGwA7fzNLw9ls0eT",
  "Compendium.wfrp4e-wom.actors.Actor.1Fw8roY9zezj0jAn.Item.IkcUAJpN3iE255rn": "wfrp4e-core.items.sRuMlaPU5xdIrwhd:verified-native-IkcUAJpN3iE255rn",
  "Compendium.wfrp4e-wom.actors.Actor.oldtgeL8W8JqlmMA.Item.XR4NI16geEtGhYyx": "wfrp4e-wom.items.foZedAFB3TQpU0SJ:verified-native-XR4NI16geEtGhYyx",
  "Compendium.wfrp4e-wom.actors.Actor.vErRQ0QEVapPSdkM.Item.z5GrcCOaKdERpci2": "wfrp4e-wom.items.YoyD7AC2GcyuVUUj:verified-native-z5GrcCOaKdERpci2",
  "Compendium.wfrp4e-wom.actors.Actor.OtBqhr035Qdf3XNo.Item.c7Y1Yt1IdwuZtqen": "wfrp4e-wom.items.QMEeB4BonCjEsedj:verified-native-c7Y1Yt1IdwuZtqen",
  "Compendium.wfrp4e-wom.actors.Actor.vErRQ0QEVapPSdkM.Item.Ic8pTQE9uBfgOSVu": "wfrp4e-wom.items.7cuV5Zsu5jeeBpXF:verified-native-Ic8pTQE9uBfgOSVu",
  "Compendium.wfrp4e-wom.actors.Actor.u2tiVh3bjxz8pBxb.Item.7cBe8ivatozoVM26": "wfrp4e-wom.items.8p5d7p50m9GBuLQV:verified-native-7cBe8ivatozoVM26"
});

for (const rule of Object.values(RULES)) Object.freeze(rule);
const fieldValue = (object, path) => path.split(".").reduce((value, key) => value?.[key], object) ?? null;
const normalize = value => String(value ?? "").replace(/\s+/g, " ").trim();
const scriptContext = source => (source.effects ?? []).flatMap(effect =>
    (effect.system?.scriptData ?? []).map(script => [script.trigger ?? null, script.script ?? null, script.options ?? null]));
const canonicalOrigin = value => String(value ?? "").replace(/^Compendium\.wfrp4e-wom\.actors\.([A-Za-z0-9]{16})\.Item\./,
    "Compendium.wfrp4e-wom.actors.Actor.$1.Item.");
export function verifiedRule(source) {
    if (game.modules?.get("wfrp4e-wom")?.version !== "8.0.0") return null;
    const refs = [source?.flags?.core?.sourceId, source?._stats?.compendiumSource]
        .filter(value => typeof value === "string" && value.length).map(canonicalOrigin);
    if (!refs.length || new Set(refs).size !== 1) return null;
    const rule = RULES[ORIGINS[refs[0]]];
    if (!rule || source._id !== refs[0].split(".").at(-1)
        || source.type !== rule.type || source.name !== rule.name) return null;
    if (rule.pack === "wfrp4e-core.items" && game.modules?.get("wfrp4e-core")?.version !== "8.0.1") return null;
    if (normalize(source.system?.description?.value) !== normalize(rule.sourceDescription)) return null;
    if (Object.entries(rule.guardFields).some(([path, value]) => fieldValue(source, path) !== value)) return null;
    if (Object.entries(rule.guardCollections ?? {}).some(([path, value]) => JSON.stringify(fieldValue(source, path)) !== JSON.stringify(value))) return null;
    if (JSON.stringify(scriptContext(source)) !== JSON.stringify(rule.sourceScripts)) return null;
    return rule;
}
// Canonical translation contributes effect names and script labels only.
// The embedded document owns its actual effect mechanics and versioned shape.
function protectEffectMechanics(payload, source) {
    if (!Array.isArray(payload?.effects)) return;
    payload.effects = (source.effects ?? []).map(original => {
        const translated = payload.effects.find(effect => effect._id === original._id);
        const result = foundry.utils.deepClone(original);
        if (typeof translated?.name === "string") result.name = translated.name;
        for (let index = 0; index < (result.system?.scriptData?.length ?? 0); index++) {
            const label = translated?.system?.scriptData?.[index]?.label;
            if (typeof label === "string") result.system.scriptData[index].label = label;
        }
        return result;
    });
}
export function routeEmbeddedRule(context, babele) {
    // Only fallback from a global Item pack; the local embedded payload is
    // applied afterwards by DocumentConverter and remains authoritative.
    if (context.metadata?.type !== "Item" || !context.metadata?.id?.endsWith(".items")) return false;
    const rule = verifiedRule(context.source);
    if (!rule) return false;
    if (context.metadata.id === rule.pack) {
        protectEffectMechanics(context.translated, context.source);
        return false;
    }
    const pack = babele.mappedCompendiumFor(rule.pack);
    if (!pack?.translated) return false;
    const lookup = foundry.utils.mergeObject(context.source, {_id: rule.canonicalId}, {inplace: false});
    if (!pack.hasTranslation(lookup, "Item")) return false;
    const payload = pack.translate(lookup, true, context.runtime);
    // Root identity is metadata for matching; never publish the canonical ID.
    delete payload._id;
    delete payload.id;
    protectEffectMechanics(payload, context.source);
    context.translated = payload;
    return true;
}
if (globalThis.Hooks) Hooks.on("babele.init", babele => {
    Hooks.on("babele.translateDocumentData", context => routeEmbeddedRule(context, babele));
});
