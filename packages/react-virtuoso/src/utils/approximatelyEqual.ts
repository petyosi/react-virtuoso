export function approximatelyEqual(num1: number, num2: number) {
  return Math.abs(num1 - num2) < 1.01
}
