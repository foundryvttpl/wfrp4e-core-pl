let species = await ValueDialog.create({text : "Podaj gatunek celu (liczba pojedyncza)", title : this.effect.name})

this.effect.updateSource({name : this.effect.setSpecifier(species)});
