export function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== "");
  const headers = lines[0].split("\t").length > 1
    ? lines[0].split("\t")
    : lines[0].split(",");

  return lines.slice(1).map(line => {
    const values = line.split("\t").length > 1
      ? line.split("\t")
      : line.split(",");

    const obj = {};
    headers.forEach((h, i) => {
      obj[h.trim()] = (values[i] || "").trim();
    });
    return obj;
  });
}
