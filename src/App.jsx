import { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Plus, Trash2, Download, FileDown, Gem } from 'lucide-react';
import { Card, Field, Input, Select, Textarea, Button } from './components/ui';
import { cn } from './lib/cn';
import { formatBRL, formatKg, formatDate, todayISO, genId } from './lib/format';

const MATERIALS = ['Linear', 'Convencional', 'Colorido', 'Cristal', 'Metaloceno', 'Alta'];
const CUSTOM_MATERIAL = '__outro__';
const PEDIDO_DRAFT_KEY = 'lord_pedidos_draft_pedido';

function emptyItem() {
  return { id: genId(), material: 'Linear', codigo: '', qtdKg: '', vlrKg: '', ipi: 5, icms: 18 };
}

function emptyPedido() {
  return {
    empresa: '', cnpj: '', dataEmissao: todayISO(), enderecoEntrega: '',
    itens: [emptyItem()],
    pagamento: '', frete: 'CIF', dataEntrega: '', periodoEntrega: '', observacoes: '',
  };
}

function itemCalc(it) {
  const qtd = Number(it.qtdKg) || 0;
  const vlr = Number(it.vlrKg) || 0;
  const ipiPct = Number(it.ipi) || 0;
  const icmsPct = Number(it.icms) || 0;
  const subtotal = qtd * vlr;
  const valorIpi = subtotal * (ipiPct / 100);
  const valorIcms = subtotal * (icmsPct / 100);
  return { subtotal, valorIpi, totalComIpi: subtotal + valorIpi, valorIcms };
}

function useTotals(itens) {
  return itens.reduce(
    (acc, it) => {
      const c = itemCalc(it);
      return {
        subtotal: acc.subtotal + c.subtotal,
        totalIpi: acc.totalIpi + c.valorIpi,
        totalIcms: acc.totalIcms + c.valorIcms,
        totalKg: acc.totalKg + (Number(it.qtdKg) || 0),
      };
    },
    { subtotal: 0, totalIpi: 0, totalIcms: 0, totalKg: 0 },
  );
}

const NAVY = '#0F172A';
const labelStyle = { fontSize: 10, fontWeight: 800, color: NAVY, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 };
const rowStyle = { display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0' };
// Caixas dentro da linha de totais usam alignItems:'stretch' (mesma altura), então cada
// uma precisa de flex column + justify-content:space-between pra distribuir o conteúdo
// por igual em vez de ficar tudo colado no topo com sobra em branco embaixo (ou o
// contrário: conteúdo colado embaixo, cortando/parecendo fora do lugar).
const summaryBoxStyle = { borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' };

function PedidoPreview({ doc, totals, previewRef }) {
  const totalComIpi = totals.subtotal + totals.totalIpi;
  const entregaFormatted = doc.dataEntrega ? formatDate(doc.dataEntrega) + (doc.periodoEntrega ? ` (${doc.periodoEntrega})` : '') : '—';

  return (
    <div ref={previewRef} style={{ fontFamily: 'Inter, Arial, sans-serif', background: '#fff', width: 1250 }}>
      <div style={{ background: NAVY, padding: '30px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ color: '#fff', fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px' }}>LORD POLÍMEROS</div>
          <div style={{ color: '#CBD5E1', fontSize: 12.5 }}>Pedido Comercial</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#fff', fontSize: 12.5, fontWeight: 700 }}>Pedido Comercial</div>
          <div style={{ color: '#94A3B8', fontSize: 11.5 }}>Emissão: {formatDate(doc.dataEmissao)}</div>
        </div>
      </div>

      <div style={{ padding: '38px 36px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 26 }}>
          <div>
            <div style={labelStyle}>Cliente</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: NAVY }}>{doc.empresa || '—'}</div>
            <div style={{ fontSize: 12.5, color: '#64748B' }}>{doc.cnpj || '—'}</div>
          </div>
          <div>
            <div style={labelStyle}>Endereço de Entrega</div>
            <div style={{ fontSize: 13.5, color: NAVY }}>{doc.enderecoEntrega || '—'}</div>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, marginBottom: 8 }}>
          <thead>
            <tr>
              {['Material', 'Cód.', 'Qtd (kg)', 'Vlr Unit.', 'IPI %', 'Valor IPI', 'ICMS %*', 'Total c/IPI'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 800, fontSize: 10.5, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.04em', borderBottom: `2px solid ${NAVY}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {doc.itens.map((it) => {
              const c = itemCalc(it);
              return (
                <tr key={it.id} style={{ borderBottom: '1px solid #E9EDF3' }}>
                  <td style={{ padding: '12px', color: NAVY, fontWeight: 600 }}>{it.material || '—'}</td>
                  <td style={{ padding: '12px', color: '#94A3B8' }}>{it.codigo || '—'}</td>
                  <td style={{ padding: '12px', color: NAVY }}>{formatKg(it.qtdKg)}</td>
                  <td style={{ padding: '12px', color: NAVY }}>{formatBRL(it.vlrKg)}</td>
                  <td style={{ padding: '12px', color: NAVY }}>{Number(it.ipi) || 0}%</td>
                  <td style={{ padding: '12px', color: NAVY }}>{formatBRL(c.valorIpi)}</td>
                  <td style={{ padding: '12px', color: '#94A3B8' }}>{Number(it.icms) || 0}%*</td>
                  <td style={{ padding: '12px', color: '#2563EB', fontWeight: 700 }}>{formatBRL(c.totalComIpi)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ fontSize: 10.5, color: '#94A3B8', marginBottom: 26 }}>* ICMS já incluso no preço unitário — valor apresentado para fins informativos</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr 1fr', gap: 18, marginBottom: 26, alignItems: 'stretch' }}>
          <div style={{ ...summaryBoxStyle, background: '#F7F8FA', border: '1px solid #E9EDF3' }}>
            <div>
              <div style={{ ...labelStyle, color: '#64748B' }}>Total em KG</div>
              <div style={{ fontSize: 21, fontWeight: 800, color: NAVY }}>{formatKg(totals.totalKg)} kg</div>
            </div>
            <div>
              <div style={{ ...labelStyle, color: '#64748B' }}>Tipo de Frete</div>
              <span style={{ display: 'inline-block', background: '#16A34A', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 999, lineHeight: 1.4 }}>{doc.frete}</span>
            </div>
          </div>
          <div style={{ ...summaryBoxStyle, background: NAVY }}>
            <div>
              <div style={{ ...labelStyle, color: '#94A3B8', marginBottom: 10 }}>Resumo Financeiro</div>
              <div style={rowStyle}><span style={{ color: '#CBD5E1' }}>Subtotal de materiais</span><span style={{ color: '#fff' }}>{formatBRL(totals.subtotal)}</span></div>
              <div style={rowStyle}><span style={{ color: '#CBD5E1' }}>Total IPI</span><span style={{ color: '#fff' }}>{formatBRL(totals.totalIpi)}</span></div>
              <div style={rowStyle}><span style={{ color: '#60A5FA', fontWeight: 700 }}>Total com IPI</span><span style={{ color: '#60A5FA', fontWeight: 700 }}>{formatBRL(totalComIpi)}</span></div>
              <div style={rowStyle}><span style={{ color: '#94A3B8', fontSize: 10.5 }}>ICMS (informativo — incluso no preço)</span><span style={{ color: '#94A3B8', fontSize: 10.5 }}>{formatBRL(totals.totalIcms)}</span></div>
            </div>
            <div style={{ borderTop: '1px solid #334155', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ color: '#fff', fontSize: 12.5, fontWeight: 700 }}>TOTAL GERAL</span>
              <span style={{ color: '#fff', fontSize: 19, fontWeight: 800 }}>{formatBRL(totalComIpi)}</span>
            </div>
          </div>
          <div style={{ ...summaryBoxStyle, border: '1px solid #E9EDF3' }}>
            {[['Pagamento', doc.pagamento], ['Frete', doc.frete], ['Entrega', entregaFormatted]].map(([label, val]) => (
              <div key={label}>
                <div style={{ ...labelStyle, marginBottom: 3, fontSize: 9.5 }}>{label}</div>
                <div style={{ fontSize: 12.5, color: '#334155' }}>{val || '—'}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ borderLeft: '3px solid #2563EB', background: '#F7F8FA', padding: '12px 16px', fontSize: 12.5, color: '#334155', fontStyle: 'italic', marginBottom: 22 }}>
          Pedido para {(doc.empresa || '—').toUpperCase()}. Frete {doc.frete}. Endereço de entrega: {doc.enderecoEntrega || '—'}.
        </div>

        {doc.observacoes && (
          <div style={{ marginBottom: 8 }}>
            <div style={labelStyle}>Observações</div>
            <div style={{ fontSize: 13, color: NAVY }}>{doc.observacoes}</div>
          </div>
        )}
      </div>

      <div style={{ background: NAVY, padding: '22px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: '#fff', fontSize: 13.5, fontWeight: 700 }}>LORD POLÍMEROS</div>
        <div style={{ color: '#94A3B8', fontSize: 11.5 }}>www.lord.com.br</div>
      </div>
    </div>
  );
}

function ItemsEditor({ itens, setItem, addItem, removeItem, totals }) {
  return (
    <Card className="p-5 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[12px] font-bold text-text-2 uppercase tracking-wide">Materiais</div>
        <button onClick={addItem} className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-blue hover:underline">
          <Plus size={14} /> Adicionar Material
        </button>
      </div>
      <div className="space-y-3">
        {itens.map((it) => {
          const c = itemCalc(it);
          const isCustom = !MATERIALS.includes(it.material);
          return (
            <div key={it.id} className="border border-border rounded-md p-3">
              <div className="grid grid-cols-[1fr_1fr_auto] gap-2 mb-2">
                <Select
                  value={isCustom ? CUSTOM_MATERIAL : it.material}
                  onChange={(e) => setItem(it.id, 'material', e.target.value === CUSTOM_MATERIAL ? '' : e.target.value)}
                >
                  {MATERIALS.map((m) => <option key={m} value={m}>{m}</option>)}
                  <option value={CUSTOM_MATERIAL}>Outro (digitar nome)</option>
                </Select>
                <Input value={it.codigo} onChange={(e) => setItem(it.id, 'codigo', e.target.value)} placeholder="Cód. interno" />
                <button onClick={() => removeItem(it.id)} title="Remover material" className="text-text-2 hover:text-red px-2"><Trash2 size={15} /></button>
              </div>
              {isCustom && (
                <Input
                  className="mb-2"
                  value={it.material}
                  onChange={(e) => setItem(it.id, 'material', e.target.value)}
                  placeholder="Nome do material"
                  autoFocus
                />
              )}
              <div className="grid grid-cols-4 gap-2 mb-2">
                <Input type="number" min="0" value={it.qtdKg} onChange={(e) => setItem(it.id, 'qtdKg', e.target.value)} placeholder="Qtd (kg)" />
                <Input type="number" min="0" step="0.01" value={it.vlrKg} onChange={(e) => setItem(it.id, 'vlrKg', e.target.value)} placeholder="Vlr/kg (R$)" />
                <Input type="number" min="0" value={it.ipi} onChange={(e) => setItem(it.id, 'ipi', e.target.value)} placeholder="IPI %" />
                <Input type="number" min="0" value={it.icms} onChange={(e) => setItem(it.id, 'icms', e.target.value)} placeholder="ICMS %" />
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11.5px] text-text-2">
                <span>Subtotal: <b className="text-text-1">{formatBRL(c.subtotal)}</b></span>
                <span>+ IPI: <b className="text-text-1">{formatBRL(c.valorIpi)}</b></span>
                <span>Total c/ IPI: <b className="text-text-1">{formatBRL(c.totalComIpi)}</b></span>
                <span>ICMS {Number(it.icms) || 0}% — incluso no preço</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-end gap-4 text-[13px] font-semibold text-text-1 mt-3 pt-3 border-t border-border">
        <span>{formatKg(totals.totalKg)} kg</span>
        <span>Subtotal: {formatBRL(totals.subtotal)}</span>
        <span>Total c/ IPI: {formatBRL(totals.subtotal + totals.totalIpi)}</span>
      </div>
    </Card>
  );
}

function PedidoForm({ doc, set, setItem, addItem, removeItem, totals }) {
  return (
    <div>
      <Card className="p-5 mb-4">
        <div className="text-[12px] font-bold text-text-2 uppercase tracking-wide mb-3">Dados do Cliente</div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nome da Empresa" required><Input value={doc.empresa} onChange={(e) => set('empresa', e.target.value)} placeholder="Ex: Empresa XYZ Ltda" /></Field>
          <Field label="CNPJ"><Input value={doc.cnpj} onChange={(e) => set('cnpj', e.target.value)} placeholder="00.000.000/0000-00" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Data de Emissão"><Input type="date" value={doc.dataEmissao} onChange={(e) => set('dataEmissao', e.target.value)} /></Field>
          <Field label="Endereço de Entrega"><Input value={doc.enderecoEntrega} onChange={(e) => set('enderecoEntrega', e.target.value)} placeholder="Rua, número, bairro, cidade - UF" /></Field>
        </div>
      </Card>

      <ItemsEditor itens={doc.itens} setItem={setItem} addItem={addItem} removeItem={removeItem} totals={totals} />

      <Card className="p-5 mb-4">
        <div className="text-[12px] font-bold text-text-2 uppercase tracking-wide mb-3">Condições Comerciais</div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Pagamento"><Input value={doc.pagamento} onChange={(e) => set('pagamento', e.target.value)} placeholder="Ex: A VISTA, 30 DDL" /></Field>
          <Field label="Frete">
            <Select value={doc.frete} onChange={(e) => set('frete', e.target.value)}>
              <option value="CIF">CIF</option>
              <option value="FOB">FOB</option>
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Data de Entrega"><Input type="date" value={doc.dataEntrega} onChange={(e) => set('dataEntrega', e.target.value)} /></Field>
          <Field label="Período de Entrega"><Input value={doc.periodoEntrega} onChange={(e) => set('periodoEntrega', e.target.value)} placeholder="Ex: Manhã, Tarde, Integral" /></Field>
        </div>
        <Field label="Observações extras (opcional)"><Textarea rows={3} value={doc.observacoes} onChange={(e) => set('observacoes', e.target.value)} /></Field>
      </Card>
    </div>
  );
}

function usePedidoDraft() {
  const [doc, setDoc] = useState(() => {
    try {
      const saved = localStorage.getItem(PEDIDO_DRAFT_KEY);
      return saved ? JSON.parse(saved) : emptyPedido();
    } catch {
      return emptyPedido();
    }
  });

  useEffect(() => {
    localStorage.setItem(PEDIDO_DRAFT_KEY, JSON.stringify(doc));
  }, [doc]);

  const set = (k, v) => setDoc((d) => ({ ...d, [k]: v }));
  const setItem = (id, k, v) => setDoc((d) => ({ ...d, itens: d.itens.map((it) => (it.id === id ? { ...it, [k]: v } : it)) }));
  const addItem = () => setDoc((d) => ({ ...d, itens: [...d.itens, emptyItem()] }));
  const removeItem = (id) => setDoc((d) => ({ ...d, itens: d.itens.length > 1 ? d.itens.filter((it) => it.id !== id) : d.itens }));
  const reset = () => setDoc(emptyPedido());

  return { doc, set, setItem, addItem, removeItem, reset };
}

function PedidoTab() {
  const { doc, set, setItem, addItem, removeItem, reset } = usePedidoDraft();
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const previewRef = useRef(null);
  const totals = useTotals(doc.itens);

  useEffect(() => {
    setResult(null);
  }, [doc]);

  const novoDoc = () => { if (confirm('Começar um novo pedido? O rascunho atual será substituído.')) reset(); };

  const fileBaseName = () => `pedido-${(doc.empresa || 'lord-polimeros').trim().replace(/\s+/g, '-').toLowerCase()}-${doc.dataEmissao}`;

  const gerar = async () => {
    if (!doc.empresa.trim()) { alert('Informe o nome da empresa'); return; }
    if (!previewRef.current) return;
    setGenerating(true);
    try {
      const canvas = await html2canvas(previewRef.current, { backgroundColor: '#ffffff', scale: 4, useCORS: true });
      setResult({ dataUrl: canvas.toDataURL('image/png'), width: canvas.width, height: canvas.height });
    } finally {
      setGenerating(false);
    }
  };

  const baixarPng = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.dataUrl;
    a.download = `${fileBaseName()}.png`;
    a.click();
  };

  const baixarPdf = () => {
    if (!result) return;
    const pageW = 297, pageH = 210, margin = 3;
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape', compress: true });
    const availW = pageW - margin * 2;
    const availH = pageH - margin * 2;
    const ratio = Math.min(availW / result.width, availH / result.height);
    const drawW = result.width * ratio;
    const drawH = result.height * ratio;
    const x = (pageW - drawW) / 2;
    const y = (pageH - drawH) / 2;
    pdf.addImage(result.dataUrl, 'PNG', x, y, drawW, drawH, undefined, 'FAST');
    pdf.save(`${fileBaseName()}.pdf`);
  };

  return (
    <div className="max-w-[820px] mx-auto">
      <div className="flex justify-end mb-3">
        <Button variant="ghost" onClick={novoDoc}>Novo Pedido</Button>
      </div>

      <PedidoForm doc={doc} set={set} setItem={setItem} addItem={addItem} removeItem={removeItem} totals={totals} />

      <Button variant="primary" onClick={gerar} disabled={generating} className="w-full justify-center py-3">
        <FileDown size={16} /> {generating ? 'Gerando...' : 'Gerar Pedido'}
      </Button>

      {result && (
        <Card className="mt-5 p-4">
          <div className="text-[12px] font-bold text-text-2 uppercase tracking-wide mb-3">Documento gerado</div>
          <img src={result.dataUrl} alt="Documento gerado" className="w-full rounded-md border border-border" />
          <div className="flex gap-2 mt-4">
            <Button variant="secondary" onClick={baixarPng} className="flex-1 justify-center">
              <Download size={15} /> Baixar PNG
            </Button>
            <Button variant="primary" onClick={baixarPdf} className="flex-1 justify-center">
              <FileDown size={15} /> Baixar PDF
            </Button>
          </div>
        </Card>
      )}

      <div style={{ position: 'fixed', top: -100000, left: -100000, pointerEvents: 'none' }} aria-hidden="true">
        <PedidoPreview doc={doc} totals={totals} previewRef={previewRef} />
      </div>
    </div>
  );
}

// --- Orçamento: apenas uma tabela de preços editável e exportável (sem cliente/frete/totais) ---

function emptyPriceRow(kind) {
  return kind === 'recuperado' ? { id: genId(), material: '', preco: '' } : { id: genId(), material: '', nacional: '', importado: '' };
}

// contentEditable em vez de <input>: html2canvas não renderiza <input> de forma
// confiável (corta o texto), mas renderiza texto comum perfeitamente.
function EditableText({ value, onChange, placeholder, className }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && ref.current.textContent !== (value || '')) {
      ref.current.textContent = value || '';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      onInput={(e) => onChange(e.currentTarget.textContent)}
      onBlur={(e) => onChange(e.currentTarget.textContent)}
      className={cn(
        'w-full bg-transparent border border-transparent rounded px-1.5 py-1 outline-none transition-colors leading-normal',
        'hover:border-border focus:border-blue focus:bg-card',
        'empty:before:content-[attr(data-placeholder)] empty:before:text-[#94A0AF]',
        className,
      )}
    />
  );
}

function PriceTable({ storageKey, kind, title, subtitle }) {
  const recuperado = kind === 'recuperado';
  const [rows, setRows] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [emptyPriceRow(kind)];
    } catch {
      return [emptyPriceRow(kind)];
    }
  });
  const [exporting, setExporting] = useState(false);
  const exportRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(rows));
  }, [rows, storageKey]);

  const setRowField = (id, key, value) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  const addRow = () => setRows((rs) => [...rs, emptyPriceRow(kind)]);
  const removeRow = (id) => setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.id !== id) : rs));

  const exportPng = async () => {
    if (!exportRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(exportRef.current, { backgroundColor: '#ffffff', scale: 3, useCORS: true });
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `${title.trim().replace(/\s+/g, '-').toLowerCase() || 'tabela-de-precos'}-${todayISO()}.png`;
      a.click();
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-end mb-3">
        <Button variant="primary" onClick={exportPng} disabled={exporting}>
          <Download size={14} /> {exporting ? 'Exportando...' : 'Exportar PNG'}
        </Button>
      </div>

      <Card className="p-8">
        <div ref={exportRef} className="bg-card p-2">
          <div className="text-2xl font-bold text-text-1 mb-1">{title}</div>
          <div className="text-sm text-text-2 mb-5">{subtitle}</div>

          <div className="border border-border rounded-md overflow-x-auto">
            {recuperado ? (
              <div className="grid grid-cols-2 bg-bg text-sm font-bold text-text-1 min-w-[320px]">
                <div className="px-4 py-3">Material</div>
                <div className="px-4 py-3">Preço</div>
              </div>
            ) : (
              <div className="grid grid-cols-3 bg-bg text-sm font-bold text-text-1 min-w-[420px]">
                <div className="px-4 py-3">Material</div>
                <div className="px-4 py-3">Nacional</div>
                <div className="px-4 py-3">Importado</div>
              </div>
            )}
            {rows.map((row, i) => (
              <div
                key={row.id}
                className={cn(
                  'grid items-center',
                  recuperado ? 'grid-cols-[1fr_1fr_auto] min-w-[320px]' : 'grid-cols-[1fr_1fr_1fr_auto] min-w-[420px]',
                  i > 0 && 'border-t border-border',
                )}
              >
                <EditableText value={row.material} onChange={(v) => setRowField(row.id, 'material', v)} placeholder="Material" className="px-3 py-2.5 font-semibold text-text-1 text-[15px]" />
                {recuperado ? (
                  <EditableText value={row.preco} onChange={(v) => setRowField(row.id, 'preco', v)} placeholder="R$ 0,00 + IPI" className="px-3 py-2.5 text-text-1 text-[15px]" />
                ) : (
                  <>
                    <EditableText value={row.nacional} onChange={(v) => setRowField(row.id, 'nacional', v)} placeholder="R$ 0,00 + IPI" className="px-3 py-2.5 text-text-1 text-[15px]" />
                    <EditableText value={row.importado} onChange={(v) => setRowField(row.id, 'importado', v)} placeholder="—" className="px-3 py-2.5 text-text-1 text-[15px]" />
                  </>
                )}
                <button data-html2canvas-ignore="true" onClick={() => removeRow(row.id)} className="text-text-2 hover:text-red px-3 shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <button data-html2canvas-ignore="true" onClick={addRow} className="flex items-center gap-1.5 text-sm font-semibold text-blue mt-4 hover:underline">
          <Plus size={15} /> Adicionar material
        </button>
      </Card>
    </div>
  );
}

function OrcamentosTab() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <PriceTable storageKey="lord_pedidos_price_table" kind="padrao" title="Tabela de Preços" subtitle="Valores por material • R$ + IPI" />
      <PriceTable storageKey="lord_pedidos_price_table_recuperado" kind="recuperado" title="Material Recuperado" subtitle="Valores por material • R$ + IPI" />
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('pedido');

  return (
    <div className="min-h-screen bg-bg">
      <header className="bg-card border-b border-border px-6 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-[10px] bg-blue flex items-center justify-center shrink-0">
          <Gem size={16} strokeWidth={1.8} color="#fff" />
        </div>
        <div>
          <div className="text-[15px] font-bold text-text-1">Gerador de Documentos</div>
          <div className="text-[11.5px] text-text-2">Pedidos e orçamentos no padrão LORD POLÍMEROS</div>
        </div>
      </header>

      <div className="max-w-[820px] mx-auto px-6 pt-5">
        <div className="inline-flex bg-card border border-border rounded-md p-1 gap-1">
          {[['pedido', 'Pedido'], ['orcamento', 'Orçamento']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={
                activeTab === key
                  ? 'px-4 py-2 rounded-sm text-[13px] font-semibold bg-blue text-white'
                  : 'px-4 py-2 rounded-sm text-[13px] font-semibold text-text-2 hover:text-text-1'
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-[1100px] mx-auto p-6">
        {activeTab === 'pedido' ? <PedidoTab /> : <OrcamentosTab />}
      </main>
    </div>
  );
}
