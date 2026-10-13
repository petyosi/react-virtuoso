export const stressStyles = `
.prepend-stress {
  color: #17212e;
  font:
    14px/1.45 system-ui,
    sans-serif;
}
.prepend-stress > p {
  max-width: 950px;
}
.prepend-controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.prepend-controls button {
  background: #17212e;
  color: white;
  border: 0;
  border-radius: 4px;
  padding: 9px 12px;
  cursor: pointer;
}
.prepend-controls button:disabled {
  opacity: 0.5;
  cursor: default;
}
.prepend-controls label {
  display: flex;
  align-items: center;
  gap: 6px;
}
.prepend-result {
  display: block;
  min-height: 24px;
  padding: 12px 0;
  font-family: monospace;
}
.prepend-stage {
  position: relative;
  border: 3px solid #17212e;
}
.prepend-guide {
  position: absolute;
  top: 84px;
  left: -3px;
  right: -3px;
  border-top: 2px dashed #ffe600;
  pointer-events: none;
  z-index: 10;
}
.prepend-message {
  box-sizing: border-box;
  background: #102c42;
  color: #f1f7fb;
  border-left: 12px solid #39e4d0;
  border-bottom: 3px solid #39e4d0;
  padding: 14px 18px;
  overflow-wrap: anywhere;
}
.prepend-message[data-tone='1'] {
  background: #292348;
  border-color: #b1a1ff;
}
.prepend-message header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  color: #cef8ff;
}
.prepend-message header strong {
  font: 900 25px/1.2 monospace;
  color: white;
}
.prepend-message p {
  margin: 12px 0;
}
.prepend-message blockquote {
  border-left: 4px solid #ffca68;
  padding: 12px;
  margin: 12px 0;
  background: #ffffff12;
}
.prepend-message pre {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  background: #080f1d;
  color: #7ff1b9;
  padding: 14px;
  font: 12px/1.6 monospace;
}
.prepend-message table {
  border-collapse: collapse;
  width: 100%;
  font-size: 12px;
}
.prepend-message th,
.prepend-message td {
  border: 1px solid #658299;
  text-align: left;
  padding: 6px;
}
.prepend-message footer {
  color: #c2d1e4;
  font-size: 11px;
  border-top: 1px solid #ffffff30;
  padding-top: 10px;
}
.prepend-message summary {
  cursor: pointer;
  padding: 12px 0;
  color: #ffdb85;
}
.prepend-attachments {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin: 12px 0;
}
.prepend-attachments figure {
  margin: 0;
  padding: 8px;
  background: #080f1d;
}
.prepend-attachments figcaption {
  font-size: 11px;
  margin-top: 8px;
}
.prepend-preview {
  display: grid;
  place-items: center;
  background: repeating-linear-gradient(135deg, #316380 0 9px, #183b59 9px 18px);
  color: white;
  font: bold 25px monospace;
}
`
