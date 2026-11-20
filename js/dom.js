/** Say something to screen readers without moving focus (the #status line in index.html). */
export function announce(text) {
  const status = document.getElementById('status');
  if (!status) return;
  status.textContent = '';
  setTimeout(() => { status.textContent = text; }, 50);
}

/** Build an element. Attributes starting with "on" become event listeners; `class` sets the class name. */
export function h(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'class') node.className = value;
    else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else if (value === true) node.setAttribute(key, '');
    else if (value !== false && value != null) node.setAttribute(key, value);
  }
  for (const child of children.flat()) {
    if (child != null && child !== false) node.append(child);
  }
  return node;
}
