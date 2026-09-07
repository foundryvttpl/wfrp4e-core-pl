// If a full dose is imbibed, 
// the victim must pass a Hard (-20) Endurance Test.

let test = await this.actor.setupSkill(game.i18n.localize("NAME.Endurance"), {fields: {difficulty: "hard"}})
await test.roll()
if (test.failed)
{
    this.script.message(`<p><strong>${this.actor.prototypeToken.name}</strong> nie zauważa nic poza tym, że staje się zmęczony trochę wcześniej niż zwykle. W tym momencie nadal można uratować ofiarę potężnym antidotum lub magicznym środkiem.</p>
    <p>Kiedy zapadnie w sen, jest to prawie niemożliwe. W tym momencie postać musi wykonać <strong>Trudny (-20) Test Odporności</strong>. Jeśli się nie powiedzie, nigdy się nie obudzi.</p>`, 
    {
      whisper: ChatMessage.getWhisperRecipients("GM"), 
      blind: true 
    })
}
return test.failed;
