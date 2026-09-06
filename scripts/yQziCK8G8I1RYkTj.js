let add;
if (args.opposedTest?.attackerTest?.weapon?.isRanged && args.opposedTest?.result.hitloc?.value === "head") {
    add = await foundry.applications.api.DialogV2.confirm({window : {title : this.effect.name}, content : "Dodać 1 PP? basinet daje 4 PP zamiast 3 w przypadku frontalnych ataków zasięgowych"})
}

if (add) {

    args.modifiers.ap.metal++;
    args.modifiers.ap.used++;
    args.modifiers.ap.value++;
    args.modifiers.ap.details.push("+1 PP za basinet");
}
