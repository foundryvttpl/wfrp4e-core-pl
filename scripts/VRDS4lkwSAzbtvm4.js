if (args.totalWoundLoss > this.actor.system.status.wounds.value || args.opposedTest?.attackerTest.result.critical)
{
  args.extraMessages.push(`<strong>${this.effect.name}</strong>: Moze odwrocic wynik rzutu na Rane Krytyczna`)
}
