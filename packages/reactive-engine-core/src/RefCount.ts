export class RefCount {
  public readonly map: Map<symbol, number>
  constructor(initialMap = new Map<symbol, number>()) {
    this.map = initialMap
  }

  clone() {
    return new RefCount(new Map(this.map))
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

  increment(id: symbol) {
    const counter = this.map.get(id) ?? 0
    this.map.set(id, counter + 1)
  }
}
