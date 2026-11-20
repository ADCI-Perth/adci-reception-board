export function sheetRows(XLSX, data, sheetName) {
  const wb = XLSX.read(data, { type: 'array' });
  const ws = wb.Sheets[sheetName];
  if (!ws) throw new Error(`Sheet "${sheetName}" not found`);
  return XLSX.utils
    .sheet_to_json(ws, { raw: true, defval: '' })
    .map((row, i) => ({ ...row, __row: i + 2 }));
}
