let value = await ValueDialog.create({
  title : this.script.label, 
  text: "Notatki zwyciestwa do dziennika doswiadczenia"
});
value 
  ? this.actor.system.awardExp(50, value) 
  : this.actor.system.awardExp(50, this.script.label)
