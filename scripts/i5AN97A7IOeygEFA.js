if (args.applyAP && args.modifiers.ap.metal) 
{
    args.modifiers.ap.ignored += args.modifiers.ap.metal
    args.modifiers.other.push({value : args.modifiers.ap.metal, label : this.effect.name, details : "Dodano PP Metalowego Pancerza do Obrażeń" })
    args.modifiers.ap.details.push("<strong>" + this.effect.name + "</strong>: Zignorowano Metalowy Pancerz (" + args.modifiers.ap.metal + ")");
    args.modifiers.ap.metal = 0
}
