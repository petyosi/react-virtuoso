// Find the maximum element height and scroll height in different

const container = document.createElement('div')
document.body.appendChild(container)
container.style.overflow = 'auto'
container.style.height = 100

const el = document.createElement('div')
container.appendChild(el)

let max = Math.pow(2, 32)
let step = max / 2
let testHeight = max
let iter = 0

while (true) {
  el.style.height = `${testHeight}px`

  if (container.scrollHeight !== testHeight) {
    testHeight -= step
  } else {
    if (step > 2) {
      testHeight += step
    } else {
      console.log(container.scrollHeight, el.offsetHeight, el.style.height)
      break
    }
  }

  step = step / 2
  iter++
}

let maxOffsetHeight = testHeight
console.log('Maximum element height: ', maxOffsetHeight, { iter, step })
