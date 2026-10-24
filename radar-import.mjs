const norm = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
export function decodeCSV(buffer, encoding = 'utf-8') {
  return new TextDecoder(encoding, { fatal: encoding === 'utf-8' }).decode(buffer).replace(/^\uFEFF/, '');
}
export function parseCSV(text, { delimiter, header } = {}) {
  text = String(text).replace(/^\uFEFF/, '');
  if (!delimiter) {
    const candidates = [';', '\t', ',', '|'], counts = new Map(candidates.map(c=>[c,0]));
    let inQuotes=false, started=false;
    // Inspect the first logical record: punctuation and newlines inside quoted
    // cells are contents, not evidence of the file's separator.
    for(let i=0;i<text.length;i++) {
      const c=text[i];
      if(c==='"') { if(inQuotes&&text[i+1]==='"') i++; else inQuotes=!inQuotes; started=true; }
      else if(!inQuotes&&(c==='\r'||c==='\n')) { if(started) break; }
      else { if(c.trim()) started=true; if(!inQuotes&&counts.has(c)) counts.set(c,counts.get(c)+1); }
    }
    delimiter = candidates.sort((a,b)=>counts.get(b)-counts.get(a))[0];
  }
  const rows = []; let row = [], field = '', quoted = false, afterQuote = false;
  for (let i=0; i<text.length; i++) {
    const c = text[i];
    if (quoted) { if (c === '"') { if (text[i+1] === '"') { field += '"'; i++; } else { quoted=false; afterQuote=true; } } else field += c; }
    else if (c === '"' && !field && !afterQuote) quoted=true;
    else if (c === delimiter) { row.push(field); field=''; afterQuote=false; }
    else if (c === '\n' || c === '\r') { if(c==='\r' && text[i+1]==='\n') i++; row.push(field); if(row.some(x=>x.trim())) rows.push(row); row=[]; field=''; afterQuote=false; }
    else { if (afterQuote && c.trim()) throw new Error('Neočekávaný znak za uzavírací uvozovkou.'); field += c; }
  }
  if (quoted) throw new Error('Neuzavřené uvozovky v CSV.');
  row.push(field); if(row.some(x=>x.trim())) rows.push(row);
  if (!rows.length) throw new Error('Soubor neobsahuje žádné řádky.');
  if (header === undefined) header = !rows[0].some(value => /^(?:18|19|20|21)\d{2}$/.test(value.trim()));
  const width=rows[0].length;
  if(rows.some(r=>r.length!==width)) throw new Error('Řádky mají různý počet sloupců. Ověřte oddělovač.');
  return {headers: header ? rows.shift() : Array.from({length:width},(_,i)=>`Sloupec ${i+1}`), rows, delimiter, header};
}
const aliases = {code:['kodobce','kod','obec','code','vuzemi'],name:['nazevobce','nazevobcecurrent','nazevobcehistoricky','nazev','name'],year:['rok','year'],incoming:['pristehovali','pristehovani','incoming','i'],outgoing:['vystehovali','vystehovani','outgoing','e'],population:['pocetobyvatel','populace11','obyvatele','populace','population','p'],balance:['saldo','migracnisaldo','prirustekmigracni','balance']};
export function suggestMapping(headers) { return Object.fromEntries(Object.entries(aliases).map(([key, names])=>[key,headers.findIndex(h=>names.includes(norm(h)))])); }
export function suggestPopulationBasis(headers,mapping) { return norm(headers[mapping.population]) === 'populace11' ? 'start' : 'unknown'; }
export function inspectCategories(table,mapping) {
  if (mapping.code >= 0 && mapping.year >= 0) { const keys=table.rows.map(row=>`${row[mapping.code]}:${row[mapping.year]}`); if(new Set(keys).size===keys.length) return []; }
  const used=new Set(Object.values(mapping));
  return table.headers.flatMap((header,index)=> { if(used.has(index)) return []; const values=[...new Set(table.rows.map(r=>r[index]))]; if(values.length>100) return []; return [{index,header,values,suggested:values.find(v=>['celkem','total','vse','all'].includes(norm(v))) ?? ''}]; });
}
export function validateImport(table,{mapping,filters={},expectedCodes=[],names=new Map(),scope='full'}={}) {
  const errors=[], warnings=[], records=[], seen=new Set(), known=new Set(expectedCodes.map(String));
  const missing={incoming:0,outgoing:0,population:0};
  if(!Number.isInteger(mapping?.code)||mapping.code<0||!Number.isInteger(mapping?.year)||mapping.year<0) errors.push('Přiřaďte kód obce a rok.');
  if(!['incoming','outgoing'].some(k=>mapping?.[k]>=0)) errors.push('Přiřaďte alespoň přistěhovalé nebo vystěhovalé.');
  const selected=table.rows.map((row,i)=>({row,line:i+(table.header?2:1)})).filter(({row})=>Object.entries(filters).every(([i,value])=>value===''||value==null||row[Number(i)]===value));
  const number=(raw,key,line)=>{ if(raw==null||String(raw).trim()===''||['na','n/a','null','..','.','-'].includes(String(raw).trim().toLowerCase())) return null;
    const cleaned=String(raw).trim().replace(/[\s\u00a0]/g,'').replace(',','.');
    if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(cleaned)||!Number.isFinite(Number(cleaned))) {errors.push(`Řádek ${line}: ${key} není platné číslo (${raw}).`); return null;} return Number(cleaned); };
  for(const {row,line} of selected) {
    const code=String(row[mapping?.code]??'').trim(), year=number(row[mapping?.year],'rok',line);
    if(!code) errors.push(`Řádek ${line}: chybí kód obce.`);
    if(known.size && !known.has(code)) errors.push(`Řádek ${line}: neznámý kód obce ${code}.`);
    if(!Number.isInteger(year)||year<1000||year>9999) errors.push(`Řádek ${line}: neplatný kalendářní rok.`);
    const key=`${code}:${year}`; if(seen.has(key)) errors.push(`Řádek ${line}: duplicitní obec × rok ${key}; vyberte jednu kategorii.`); seen.add(key);
    const record={code,name:String(row[mapping?.name]||names.get(code)||code),year};
    for(const channel of ['incoming','outgoing','population']) {const value=number(row[mapping?.[channel]],channel,line); record[channel]=value; if(value===null) missing[channel]++; else if(value<0) errors.push(`Řádek ${line}: záporná hodnota ${channel}.`); if(channel==='population'&&value===0) warnings.push(`Řádek ${line}: nulová populace; míry budou nedostupné.`);}
    const balance=number(row[mapping?.balance],'saldo',line); if(balance!==null&&record.incoming!==null&&record.outgoing!==null&&Math.abs(balance-(record.incoming-record.outgoing))>1e-8) errors.push(`Řádek ${line}: dodané saldo neodpovídá přistěhovalí minus vystěhovalí.`);
    records.push(record);
  }
  if(!records.length) errors.push('Výběr neobsahuje datové řádky.');
  const years=[...new Set(records.map(r=>r.year))].sort((a,b)=>a-b), codes=[...new Set(records.map(r=>r.code))];
  const expected=scope==='subset'?codes:expectedCodes.map(String);
  const coverage=years.map(year=>{const rows=records.filter(r=>r.year===year);return {year,expected:expected.length,present:new Set(rows.map(r=>r.code)).size,...Object.fromEntries(['incoming','outgoing','population'].map(k=>[k,rows.filter(r=>r[k]!==null&&(k!=='population'||r[k]>0)).length]))};});
  if(scope==='subset') warnings.push('Částečné území: výsledky nereprezentují celý kraj.');
  if(missing.population) warnings.push(`Chybějící populace: ${missing.population} řádků; relativní míry budou nedostupné.`);
  if(coverage.some(c=>c.present<c.expected||c.incoming<c.expected||c.outgoing<c.expected)) warnings.push('Některé roky nebo pohybové kanály mají neúplné územní pokrytí.');
  return {records,errors,warnings,coverage,years,codes,missing,ok:errors.length===0};
}
export const CSV_TEMPLATE='kod_obce;nazev_obce;rok;pristehovali;vystehovali;pocet_obyvatel\r\n';
