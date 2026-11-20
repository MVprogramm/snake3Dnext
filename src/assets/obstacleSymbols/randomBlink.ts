// Every glyph owns its own schedule; no timers or React rerenders per frame.
export class RandomBlink {
  visible = true
  private remaining: number
  constructor(private random: () => number = Math.random) {
    this.remaining = .2 + random() * 2.3
  }
  update(delta: number): boolean {
    this.remaining -= Math.min(Math.max(delta, 0), .25)
    while (this.remaining <= 0) {
      this.visible = !this.visible
      this.remaining += this.visible ? .7 + this.random() * 1.8 : .09 + this.random() * .13
    }
    return this.visible
  }
}
