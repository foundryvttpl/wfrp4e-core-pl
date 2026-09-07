if (args.test.characteristicKey == "wp") 
{
    if (args.test.failed)
    {
        this.actor.addSystemEffect("convulsions")
        this.script.message(`Test siły woli nie powiódł się, <b>${this.actor.prototypeToken.name}</b>: Otrzymano @Symptom[Konwulsje] na [[1d10]] godzin`)
    }
}
