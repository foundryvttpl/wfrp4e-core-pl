let choice = await ItemDialog.create(this.actor.itemTypes.disease, 1, "Wybierz chorobę, którą chcesz uleczyć (Musi być naturalnego pochodzenia)")

this.script.message(`Uleczono <strong>${choice[0]?.name}</strong>`);
choice[0].delete()
