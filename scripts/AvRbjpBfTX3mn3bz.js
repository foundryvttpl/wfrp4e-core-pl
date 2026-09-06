if (this.actor.effects.contents.filter(e => e.name === "Liquid Fortification").length === 0) {
  let effectData = this.item.effects.contents[0].convertToApplied();
  effectData.duration.seconds = 3600
  this.actor.applyEffect({effectData : [effectData]});
  this.script.notification("Ustawiono czas trwania efektu Liquid Fortification na 1 godzine.");
} 
else {
  let effect = this.actor.effects.contents.filter(e => e.name === "Liquid Fortification")[0];
  effect.update({duration: {seconds: 3600}});
  this.script.notification("Zresetowano czas trwania efektu Liquid Fortification do 1 godziny.");
}
