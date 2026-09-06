if ( args.actor.has(game.i18n.localize("NAME.AA"), "talent") ||
args.actor.has(game.i18n.localize("NAME.SecondSight"), "talent") ) {
	args.modifiers.other.push({label : this.effect.name, value : 5, details : "Cel posiada Zmysł Magii lub Percepcję Magiczną"});
}
