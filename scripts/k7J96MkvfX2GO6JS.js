this.actor.update({"system.status.corruption.value" : parseInt(this.actor.system.status.corruption.value) + 1});
this.script.notification("Dodano Zepsucie");
await this.actor.addCondition("prone");
await this.actor.addCondition("fatigued");
