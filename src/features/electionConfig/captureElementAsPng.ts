const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const XHTML_NAMESPACE = "http://www.w3.org/1999/xhtml";

const copyComputedStyles = (source: Element, target: Element) => {
  if (!(source instanceof HTMLElement) || !(target instanceof HTMLElement)) {
    return;
  }

  const computedStyle = window.getComputedStyle(source);
  target.setAttribute("style", computedStyle.cssText);

  Array.from(source.children).forEach((sourceChild, index) => {
    const targetChild = target.children.item(index);
    if (targetChild) {
      copyComputedStyles(sourceChild, targetChild);
    }
  });
};

const sanitizeCloneForExport = (clone: HTMLElement) => {
  clone.querySelectorAll("img, canvas, svg").forEach((node) => {
    const replacement = document.createElement("span");
    replacement.setAttribute("aria-hidden", "true");
    replacement.style.display = "none";
    node.replaceWith(replacement);
  });
};

const loadImage = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No se pudo capturar el modal."));
    image.src = url;
  });

const isTransparent = (color: string) =>
  !color ||
  color === "transparent" ||
  color === "rgba(0, 0, 0, 0)" ||
  color === "rgba(0,0,0,0)";

const toNumber = (value: string, fallback = 0) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getRelativeRect = (element: Element, rootRect: DOMRect) => {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left - rootRect.left,
    y: rect.top - rootRect.top,
    width: rect.width,
    height: rect.height,
  };
};

const roundedRect = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) => {
  const safeRadius = Math.max(0, Math.min(radius, width / 2, height / 2));
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
};

const drawBox = (
  context: CanvasRenderingContext2D,
  element: HTMLElement,
  rootRect: DOMRect,
) => {
  const rect = getRelativeRect(element, rootRect);
  if (rect.width <= 0 || rect.height <= 0) return;

  const style = window.getComputedStyle(element);
  const radius = toNumber(style.borderTopLeftRadius, 0);

  if (!isTransparent(style.backgroundColor)) {
    context.fillStyle = style.backgroundColor;
    roundedRect(context, rect.x, rect.y, rect.width, rect.height, radius);
    context.fill();
  }

  const borderWidth = toNumber(style.borderTopWidth, 0);
  if (borderWidth > 0 && !isTransparent(style.borderTopColor)) {
    context.strokeStyle = style.borderTopColor;
    context.lineWidth = borderWidth;
    roundedRect(
      context,
      rect.x + borderWidth / 2,
      rect.y + borderWidth / 2,
      Math.max(0, rect.width - borderWidth),
      Math.max(0, rect.height - borderWidth),
      Math.max(0, radius - borderWidth / 2),
    );
    context.stroke();
  }
};

const drawDonut = (
  context: CanvasRenderingContext2D,
  element: HTMLElement,
  rootRect: DOMRect,
) => {
  const rect = getRelativeRect(element, rootRect);
  const label = element.getAttribute("aria-label") ?? "";
  const percentage = Math.max(
    0,
    Math.min(100, Number.parseFloat(label.replace(/[^\d.]/g, "")) || 0),
  );
  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;
  const radius = Math.min(rect.width, rect.height) / 2;
  const thickness = Math.max(20, radius * 0.42);
  const trackRadius = radius - thickness / 2;

  context.lineWidth = thickness;
  context.lineCap = "butt";
  context.strokeStyle = "#E3E6EA";
  context.beginPath();
  context.arc(centerX, centerY, trackRadius, 0, Math.PI * 2);
  context.stroke();

  if (percentage > 0) {
    context.strokeStyle = "#2E7D32";
    context.beginPath();
    context.arc(
      centerX,
      centerY,
      trackRadius,
      -Math.PI / 2,
      -Math.PI / 2 + (Math.PI * 2 * percentage) / 100,
    );
    context.stroke();
  }
};

const getTextNodes = (root: HTMLElement) => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      node.textContent?.trim()
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT,
  });
  const nodes: Text[] = [];
  let current = walker.nextNode();
  while (current) {
    nodes.push(current as Text);
    current = walker.nextNode();
  }
  return nodes;
};

const drawWrappedText = (
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) => {
  const words = text.split(/\s+/).filter(Boolean);
  let line = "";
  let currentY = y;

  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width > maxWidth && line) {
      context.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = candidate;
    }
  });

  if (line) {
    context.fillText(line, x, currentY);
  }
};

const drawText = (
  context: CanvasRenderingContext2D,
  textNode: Text,
  rootRect: DOMRect,
) => {
  const parent = textNode.parentElement;
  if (!parent) return;
  const rect = getRelativeRect(parent, rootRect);
  if (rect.width <= 0 || rect.height <= 0) return;

  const style = window.getComputedStyle(parent);
  if (style.display === "none" || style.visibility === "hidden") return;

  const fontSize = toNumber(style.fontSize, 14);
  const lineHeight = toNumber(style.lineHeight, fontSize * 1.25);
  const fontWeight = style.fontWeight || "400";
  const fontFamily = style.fontFamily || "Arial, sans-serif";
  const paddingLeft = toNumber(style.paddingLeft, 0);
  const paddingTop = toNumber(style.paddingTop, 0);
  const paddingRight = toNumber(style.paddingRight, 0);

  context.fillStyle = style.color || "#333333";
  context.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  context.textBaseline = "top";
  context.textAlign = style.textAlign === "right" ? "right" : "left";

  const text = textNode.textContent?.trim() ?? "";
  if (!text) return;

  const x = context.textAlign === "right"
    ? rect.x + rect.width - paddingRight
    : rect.x + paddingLeft;
  const y = rect.y + paddingTop;
  const maxWidth = Math.max(1, rect.width - paddingLeft - paddingRight);

  drawWrappedText(context, text, x, y, maxWidth, lineHeight);
};

const rasterizeElementSafely = (element: HTMLElement, width: number, height: number) => {
  const canvas = document.createElement("canvas");
  const scale = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.ceil(width * scale));
  canvas.height = Math.max(1, Math.ceil(height * scale));
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("No se pudo capturar el modal.");
  }

  context.setTransform(scale, 0, 0, scale, 0, 0);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);

  const rootRect = element.getBoundingClientRect();
  const elements = Array.from(element.querySelectorAll<HTMLElement>("*"));
  [element, ...elements].forEach((node) => {
    if (["SCRIPT", "STYLE", "IMG", "CANVAS", "SVG"].includes(node.tagName)) return;
    drawBox(context, node, rootRect);
  });

  const donut = element.querySelector<HTMLElement>('[data-testid="analytics-donut"]');
  if (donut) {
    drawDonut(context, donut, rootRect);
  }

  getTextNodes(element).forEach((node) => drawText(context, node, rootRect));

  return canvas.toDataURL("image/png");
};

const captureWithForeignObject = async (element: HTMLElement, width: number, height: number) => {
  const clone = element.cloneNode(true) as HTMLElement;
  clone.setAttribute("xmlns", XHTML_NAMESPACE);
  copyComputedStyles(element, clone);
  sanitizeCloneForExport(clone);

  const serialized = new XMLSerializer().serializeToString(clone);
  const svg = document.createElementNS(SVG_NAMESPACE, "svg");
  svg.setAttribute("xmlns", SVG_NAMESPACE);
  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.innerHTML = `<foreignObject width="100%" height="100%">${serialized}</foreignObject>`;

  const svgBlob = new Blob([new XMLSerializer().serializeToString(svg)], {
    type: "image/svg+xml;charset=utf-8",
  });
  const url = window.URL.createObjectURL(svgBlob);

  try {
    const image = await loadImage(url);
    const canvas = document.createElement("canvas");
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.ceil(width * scale));
    canvas.height = Math.max(1, Math.ceil(height * scale));
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("No se pudo capturar el modal.");
    }
    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/png");
  } finally {
    window.URL.revokeObjectURL(url);
  }
};

export const captureElementAsPng = async (element: HTMLElement) => {
  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    throw new Error("No se pudo capturar el modal.");
  }
  const width = Math.max(1, Math.ceil(rect.width));
  const height = Math.max(1, Math.ceil(rect.height));

  try {
    return await captureWithForeignObject(element, width, height);
  } catch {
    return rasterizeElementSafely(element, width, height);
  }
};
