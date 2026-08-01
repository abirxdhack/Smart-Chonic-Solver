export async function downloadGraphPng(container: HTMLElement | null, filename: string) {
  const svg = container?.querySelector<SVGSVGElement>(".graph-svg");
  if (!svg) throw new Error("গ্রাফ পাওয়া যায়নি");
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const vb = svg.viewBox.baseVal;
  const W = vb.width || svg.clientWidth || 820;
  const H = vb.height || svg.clientHeight || 720;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(W));
  clone.setAttribute("height", String(H));
  clone.querySelectorAll<SVGPathElement>("path").forEach((p) => {
    p.style.strokeDasharray = "none";
    p.style.strokeDashoffset = "0";
    p.style.animation = "none";
  });
  clone.querySelectorAll<SVGElement>("[style]").forEach((el) => {
    el.style.animation = "none";
    el.style.opacity = el.style.opacity && Number(el.style.opacity) < 1 ? el.style.opacity : "1";
  });
  const st = document.createElementNS("http://www.w3.org/2000/svg", "style");
  st.textContent =
    "text{font-family:'Hind Siliguri','Noto Sans Bengali',sans-serif}.axis-tick{font-size:11px;fill:#64748b}.axis-name{font-size:14px;fill:#334155;font-weight:700}.pt-label{font-size:11.5px;font-weight:600}";
  clone.prepend(st);
  const xml = new XMLSerializer().serializeToString(clone);
  const src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml);
  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("ছবি তৈরি করা যায়নি"));
    img.src = src;
  });
  const scale = 2;
  const canvas = document.createElement("canvas");
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("ক্যানভাস সমর্থিত নয়");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("ডাউনলোড ব্যর্থ");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
