if (args.test.preData.options?.corruption && args.test.failed) {
  args.test?.result?.other.push("Otrzymano dodatkowy Punkt Zepsucia pochodzący z " + this.effect.name)
}
