import { useCategories } from '../CategoriesContext'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import Papa from 'papaparse'

const fmtDate = (ts) => {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const fmtVal = (v) =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function StatusBadge({ status }) {
  const s = status || 'pendente'
  return (
    <span className={`badge ${s}`}>
      {s === 'pago' && <i className="ti ti-check" aria-hidden="true" />}
      {s === 'pendente' && <i className="ti ti-clock" aria-hidden="true" />}
      {s === 'atrasado' && <i className="ti ti-alert-triangle" aria-hidden="true" />}
      {s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  )
}

export default function TransactionList({ transactions, loading, onEdit, onDelete, onMarkPaid, currentAccount }) {
  const { getCategoryMeta } = useCategories()

  const exportCSV = () => {
    const data = transactions.map(t => ({
      'Data': fmtDate(t.dueDate),
      'Descrição': t.description,
      'Quantidade': t.qtd || 1,
      'Valor Unitário': t.valorUnit || t.value,
      'Valor Total': t.value
    }))
    const csv = Papa.unparse(data)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'relatorio_construcao.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportPDF = () => {
    const doc = new jsPDF()
    const tableColumn = ["Data", "Descrição", "Qtd.", "Valor Unit.", "Valor Total"];
    const tableRows = [];

    transactions.forEach(t => {
      const rowData = [
        fmtDate(t.dueDate),
        t.description,
        t.qtd || 1,
        `R$ ${fmtVal(t.valorUnit || t.value)}`,
        `R$ ${fmtVal(t.value)}`
      ];
      tableRows.push(rowData);
    });

    const total = transactions.reduce((acc, t) => acc + (t.value || 0), 0)

    doc.setFontSize(18);
    doc.text("Relatório de Despesas da Obra", 14, 22);
    
    doc.setFontSize(12);
    doc.text(`Total do Relatório: R$ ${fmtVal(total)}`, 14, 32);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 40,
    });

    doc.save('relatorio_construcao.pdf');
  }

  if (loading) return (
    <div className="list-card">
      <div className="empty-state">
        <i className="ti ti-loader" aria-hidden="true" />
        Carregando...
      </div>
    </div>
  )

  if (transactions.length === 0) return (
    <div className="list-card">
      <div className="empty-state">
        <i className="ti ti-receipt-off" aria-hidden="true" />
        Nenhum lançamento encontrado
      </div>
    </div>
  )

  if (currentAccount === 'construcao') {
    return (
      <div className="list-card">
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 15 }}>
          <button className="btn-sm secondary" onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="ti ti-file-spreadsheet" aria-hidden="true" /> Exportar CSV
          </button>
          <button className="btn-sm secondary" onClick={exportPDF} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="ti ti-file-text" aria-hidden="true" /> Exportar PDF
          </button>
        </div>
        <div className="list-header construcao">
          <div>Data</div>
          <div>Descrição</div>
          <div>Qtd.</div>
          <div>Valor Unit.</div>
          <div>Valor Total</div>
          <div>Ações</div>
        </div>

        {transactions.map(t => {
          const meta = getCategoryMeta(t.type, t.category)
          return (
            <div className="list-row construcao" key={t.id}>
              <div className="date-cell">
                {fmtDate(t.dueDate)}
              </div>
              <div className="desc-cell" style={{ justifyContent: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="cat-dot" style={{ background: meta.color, flexShrink: 0 }} />
                    <span title={t.description} className="desc-text" style={{ fontWeight: 600 }}>{t.description}</span>
                  </div>
                  {t.category && <span style={{ fontSize: 11, color: '#777', marginTop: 2, marginLeft: 14 }}>{t.category}</span>}
                </div>
                <div className="desc-meta-dates" style={{ marginLeft: 0 }}>
                  <span className="meta-due-date">
                    <i className="ti ti-calendar" aria-hidden="true" style={{ marginRight: '3px' }}></i>
                    {fmtDate(t.dueDate)}
                  </span>
                  <span className="installment-tag" style={{ marginLeft: 6 }}>
                    Qtd: {t.qtd || 1} | R$ {fmtVal(t.valorUnit || t.value)}
                  </span>
                </div>
              </div>
              <div className="qtd-cell">
                {t.qtd || 1}
              </div>
              <div className="unit-cell">
                R$ {fmtVal(t.valorUnit || t.value)}
              </div>
              <div className="value-cell expense" style={{ justifyContent: 'flex-start', alignSelf: 'center' }}>
                R$ {fmtVal(t.value || 0)}
              </div>
              <div className="actions" style={{ alignSelf: 'center' }}>
                <button className="act-btn" title="Editar" onClick={() => onEdit(t)}>
                  <i className="ti ti-edit" aria-hidden="true" />
                </button>
                <button className="act-btn danger" title="Excluir" onClick={() => onDelete(t.id)}>
                  <i className="ti ti-trash" aria-hidden="true" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="list-card">
      <div className="list-header">
        <div>Descrição</div>
        <div>Vencimento</div>
        <div>Pagamento</div>
        <div>Valor</div>
        <div>Status</div>
        <div>Ações</div>
      </div>

      {transactions.map(t => {
        const effStatus = t.computedStatus || t.status || 'pendente'
        const meta = getCategoryMeta(t.type, t.category)
        const isOverdue = effStatus === 'atrasado'

        return (
          <div className="list-row" key={t.id}>
            <div className="desc-cell">
              <div className="desc-title">
                <span className="cat-dot" style={{ background: meta.color, flexShrink: 0 }} />
                <span title={t.description} className="desc-text">{t.description}</span>
                {t.qtd && t.valorUnit && (
                  <span className="installment-tag" style={{ marginLeft: 6, fontSize: '0.8rem', color: '#666' }}>
                    (Qtd: {t.qtd} | Unit: R$ {fmtVal(t.valorUnit)})
                  </span>
                )}
                {t.installmentNum && (
                  <span className="installment-tag">({t.installmentNum}/{t.installmentTotal})</span>
                )}
              </div>
              <div className="desc-meta-dates">
                <span className={`meta-due-date${isOverdue ? ' overdue' : ''}`}>
                  <i className="ti ti-calendar" aria-hidden="true" style={{ marginRight: '3px' }}></i>
                  Venc. {fmtDate(t.dueDate)}
                </span>
                <span className="meta-pay-date">
                  <i className="ti ti-check" aria-hidden="true" style={{ marginRight: '3px' }}></i>
                  Pag. {t.paymentDate ? fmtDate(t.paymentDate) : '—'}
                </span>
              </div>
            </div>

            <div className={`date-cell${isOverdue ? ' overdue' : ''}`}>
              {fmtDate(t.dueDate)}
            </div>

            <div className="date-cell payment-date">
              {t.paymentDate ? fmtDate(t.paymentDate) : '—'}
            </div>

            <div className={`value-cell ${t.type === 'receita' ? 'income' : 'expense'}`}>
              {t.type === 'receita' ? '+' : '−'} R$ {fmtVal(t.value || 0)}
            </div>

            <div><StatusBadge status={effStatus} /></div>

            <div className="actions">
              {effStatus !== 'pago' && (
                <button className="act-btn success" title="Marcar como pago" onClick={() => onMarkPaid(t)}>
                  <i className="ti ti-check" aria-hidden="true" />
                </button>
              )}
              <button className="act-btn" title="Editar" onClick={() => onEdit(t)}>
                <i className="ti ti-edit" aria-hidden="true" />
              </button>
              <button className="act-btn danger" title="Excluir" onClick={() => onDelete(t.id)}>
                <i className="ti ti-trash" aria-hidden="true" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
