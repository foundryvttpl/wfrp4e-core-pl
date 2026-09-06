const trait = this.actor.itemTags.trait.find(t => t.name === "Regeneracja");
const name = "Zgniła Regeneracja";

if (!trait) return;

const effect = trait.effects.find(e => e.name === "Regeneracja");
const scriptData = effect.system.scriptData;

scriptData[0].script = `  
  let chatData = {whisper: ChatMessage.getWhisperRecipients("GM")};
  let message = "";
  
  let wounds = foundry.utils.duplicate(this.actor.status.wounds);
  let regenRoll = await new Roll("1d10").roll({allowInteractive : false});
  let regen = regenRoll.total;
  
  if (wounds.value >= wounds.max)
    return;
  
  if (wounds.value > 0) {
    wounds.value += Math.floor(regen / 2);
    if (wounds.value > wounds.max) {
      wounds.value = wounds.max;
    }
    message += \`<b>\${this.actor.name}</b> Odzyskane punkty Żywotności: \${regen}.\`;
  
    if (regen === 10) {
      message += "<br>Dodatkowo zregenerowano krytyczną ranę.";
    }
  } else if (regen >= 8) {
    message += \`<b>\${this.actor.name}</b> wylosowano \${regen} i odzyskano 1 punkt Żywotności.\`;
    wounds.value += 1;
    if (regen === 10) {
      message += "<br>Dodatkowo zregenerowano krytyczną ranę.";
    }
  } else {
    message += \`<b>\${this.actor.name}</b> wylosowano \${regen} - brak efektu.\`;
  }
  
  await this.actor.update({"system.status.wounds": wounds});
  this.script.message(message, {whisper: ChatMessage.getWhisperRecipients("GM")});
`

await effect.update({
  name,
  "system.scriptData": scriptData
});

await trait.update({name});
