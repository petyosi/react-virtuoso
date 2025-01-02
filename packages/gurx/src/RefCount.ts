export class RefCount {
  constructor(readonly map = new Map<symbol, number>()) {}

  clone() {
    return new RefCount(new Map(this.map))
  }

  increment(id: symbol) {
    const counter = this.map.get(id) ?? 0
    this.map.set(id, counter + 1)
  }

  decrement(id: symbol, ifZero: () => void) {
    let counter = this.map.get(id)
    if (counter !== undefined) {
      counter -= 1
      this.map.set(id, counter)
      if (counter === 0) {
        ifZero()
      }
    }
  }
}
