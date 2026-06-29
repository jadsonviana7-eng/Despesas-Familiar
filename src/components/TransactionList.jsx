import { useCategories } from '../CategoriesContext'

const fmtDate = (ts) => {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
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

export default function TransactionList({ transactions, loading, onEdit, onDelete, onMarkPaid }) {
  const { getCategoryMeta } = useCategories()

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
              <span className="cat-dot" style={{ background: meta.color, flexShrink: 0 }} />
              <span title={t.description}>{t.description}</span>
              {t.installmentNum && (
                <span className="installment-tag">({t.installmentNum}/{t.installmentTotal})</span>
              )}
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
