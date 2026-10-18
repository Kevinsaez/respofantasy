const out = document.getElementById("out"), dl = document.getElementById("dl");
document.getElementById("gen").onclick = () => {
  const u = document.getElementById("url").value.trim();
  if (!u) return alert("Pegá el link del menú");
  out.innerHTML = "";
  new QRCode(out, {text: u, width: 1024, height: 1024, colorDark: "#2A1B2E", colorLight: "#ffffff", correctLevel: QRCode.CorrectLevel.H});
  dl.hidden = false;
};
dl.onclick = () => {
  const c = out.querySelector("canvas"), a = document.createElement("a");
  a.href = c.toDataURL("image/png"); a.download = "qr-menu-respo-fantasy.png"; a.click();
};
