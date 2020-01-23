/**
 * lagRadar
 * Licence: ISC copyright: @mobz 2018
 */

export default function lagRadar( config = {} ) {
  const {
    frames = 50,    // number of frames to draw, more = worse performance
    speed = 0.0017, // how fast the sweep moves (rads per ms)
    size = 300,     // outer frame px
    inset = 3,      // circle inset px
    parent = document.body, // DOM node to attach to
  } = config;

  const svgns = 'http:\/\/www.w3.org/2000/svg';

  const styles = document.createTextNode(`
    .lagRadar-sweep > * {
      shape-rendering: crispEdges;
    }
    .lagRadar-face {
      fill: transparent;
    }
    .lagRadar-hand {
      stroke-width: 4px;
      stroke-linecap: round;
    }
  `);

  function $svg(tag, props = {}, children = []) {
    const el = document.createElementNS(svgns, tag);
    Object.keys(props).forEach( prop => el.setAttribute( prop, props[prop] ) );
    children.forEach( child => el.appendChild( child ) );
    return el;
  }

  const PI2 = Math.PI * 2;
  const middle = size / 2;
  const radius = middle - inset;

  const $hand = $svg('path', { class: 'lagRadar-hand' });
  const $arcs = (new Array(frames)).fill('path').map(t => $svg(t));
  const $root = $svg('svg', { class: 'lagRadar', height: size, width: size }, [
    $svg('style', { type: 'text/css' }, [ styles ]),
    $svg('g', { class: 'lagRadar-sweep' }, $arcs),
    $hand,
    $svg('circle', { class: 'lagRadar-face', cx: middle, cy: middle, r: radius })
  ]);

  parent.appendChild($root);

  let frame;
  let framePtr = 0;
  let last = {
    rotation: 0,
    now: Date.now(),
    tx: middle + radius,
    ty: middle,
  };

  const calcHue = (() => {
    const max_hue = 120;
    const max_ms = 1000;
    const log_f = 10;
    const mult = max_hue / Math.log(max_ms / log_f);
    return function(ms_delta) {
      return max_hue - Math.max(0, Math.min(mult * Math.log(ms_delta / log_f), max_hue ) );
    };
  })();

  function animate() {
    const now = Date.now();
    const rdelta = Math.min(PI2 - speed, speed * (now - last.now));
    const rotation = (last.rotation + rdelta) % PI2;
    const tx = middle + radius * Math.cos(rotation);
    const ty = middle + radius * Math.sin(rotation);
    const bigArc = rdelta < Math.PI ? '0' : '1';
    const path = `M${tx} ${ty}A${radius} ${radius} 0 ${bigArc} 0 ${last.tx} ${last.ty}L${middle} ${middle}`;
    const hue = calcHue(rdelta/speed);

    $arcs[framePtr % frames].setAttribute('d', path);
    $arcs[framePtr % frames].setAttribute('fill', `hsl(${hue}, 80%, 40%)`);
    $hand.setAttribute('d', `M${middle} ${middle}L${tx} ${ty}`);
    $hand.setAttribute('stroke', `hsl(${hue}, 80%, 60%)`);

    for (let i = 0; i < frames; i++) {
      $arcs[(frames + framePtr - i) % frames].style.fillOpacity = 1 - (i/frames);
    }

    framePtr++;
    last = { now, rotation, tx, ty };

    frame = window.requestAnimationFrame(animate);
  }

  animate();

  return function destroy() {
    if(frame) {
      window.cancelAnimationFrame(frame);
    }
    $root.remove();
  }

};
