import { useState, useEffect } from 'react'
import { Timestamp } from 'firebase/firestore'
import { useCategories } from '../CategoriesContext'

const toInputDate = (ts) => {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toISOString().slice(0, 10)
}

export default function TransactionModal({ initial, currentMonth, currentYear, onSave, onClose }) {
  const { expenseCategories, incomeCategories } = useCategories()
  const isEditing = !!initial

  const defaultDate = new Date(currentYear, currentMonth, new Date().getDate())
    .toISOString().slice(0, 10)

  const [type, setType] = useState(initial?.type || 'despesa')
  const [description, setDescription] = useState(initial?.description || '')
  const [category, setCategory] = useState(initial?.category || '')
  const [value, setValue] = useState(initial?.value?.toString() || '')
  const [dueDate, setDueDate] = useState(initial ? toInputDate(initial.dueDate) : defaultDate)
  const [paymentDate, setPaymentDate] = useState(initial ? toInputDate(initial.paymentDate) : '')
  const [status, setStatus] = useState(initial?.status || 'pendente')
  const [useInstallments, setUseInstallments] = useState(false)
  const [installments, setInstallments] = useState(2)
  const [saving, setSaving] = useState(false)

  const cats = type === 'despesa' ? expenseCategories : incomeCategories

  useEffect(() => { setCategory('') }, [type])

  const handleSubmit = async () => {
    if (!description.trim()) return alert('Informe a descrição.')
    if (!value || isNaN(parseFloat(value))) return alert('Informe um valor válido.')
    if (!dueDate) return alert('Informe a data de vencimento.')

    setSaving(true)
    try {
      const data = {
        type,
        description: description.trim(),
        category: category || 'Outros',
        value: parseFloat(value.replace(',', '.')),
        dueDate: Timestamp.fromDate(new Date(dueDate + 'T12:00:00')),
        paymentDate: paymentDate ? Timestamp.fromDate(new Date(paymentDate + 'T12:00:00')) : null,
        status: paymentDate ? 'pago' : status,
        installments: useInstallments && !isEditing ? installments : 1,
      }
      await onSave(data)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" role="dialog" aria-modal="true" aria-label="Lançamento financeiro">
        <div className="modal-header">
          <div className="modal-title">{isEditing ? 'Editar lançamento' : 'Novo lançamento'}</div>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">
            <i className="ti ti-x" aria-hidden="true" />
          </button>
        </div>

        <div className="modal-body">
          {/* Type */}
          <div className="form-group full">
            <label>Tipo</label>
            <div className="type-toggle">
              <button
                className={`type-btn receita${type === 'receita' ? ' active' : ''}`}
                onClick={() => setType('receita')} disabled={isEditing}
              >
                <i className="ti ti-trending-up" aria-hidden="true" /> Receita
              </button>
              <button
                className={`type-btn despesa${type === 'despesa' ? ' active' : ''}`}
                onClick={() => setType('despesa')} disabled={isEditing}
              >
                <i className="ti ti-trending-down" aria-hidden="true" /> Despesa
              </button>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full">
              <label htmlFor="mdesc">Descrição</label>
              <input id="mdesc" type="text" placeholder="Ex: Aluguel, Salário, Netflix..."
                value={description} onChange={e => setDescription(e.target.value)} autoFocus />
            </div>

            <div className="form-group">
              <label htmlFor="mcat">Categoria</label>
              <select id="mcat" value={category} onChange={e => setCategory(e.target.value)}>
                <option value="">Selecione...</option>
                {cats.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="mval">Valor (R$)</label>
              <input id="mval" type="number" min="0" step="0.01" placeholder="0,00"
                value={value} onChange={e => setValue(e.target.value)} />
            </div>

            <div className="form-group">
              <label htmlFor="mdue">Vencimento</label>
              <input id="mdue" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>

            <div className="form-group">
              <label htmlFor="mpay">Data de pagamento</label>
              <input id="mpay" type="date" value={paymentDate} onChange={e => {
                setPaymentDate(e.target.value)
                setStatus(e.target.value ? 'pago' : 'pendente')
              }} />
            </div>

            <div className="form-group">
              <label htmlFor="msts">Status</label>
              <select id="msts" value={paymentDate ? 'pago' : status}
                onChange={e => setStatus(e.target.value)} disabled={!!paymentDate}>
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
              </select>
            </div>
          </div>

          {/* Parcelas */}
          {!isEditing && type === 'despesa' && (
            <div className="form-group full">
              <div className="installment-row">
                <label className="installment-toggle">
                  <input type="checkbox" checked={useInstallments}
                    onChange={e => setUseInstallments(e.target.checked)} />
                  Parcelar em vários meses
                </label>
                {useInstallments && (
                  <select value={installments} onChange={e => setInstallments(Number(e.target.value))} style={{ width: 80 }}>
                    {[2,3,4,5,6,7,8,9,10,11,12,18,24].map(n =>
                      <option key={n} value={n}>{n}x</option>
                    )}
                  </select>
                )}
              </div>
              {useInstallments && (
                <p className="installment-hint">
                  Serão criados {installments} lançamentos de{' '}
                  R$ {value && !isNaN(parseFloat(value))
                    ? parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                    : '—'
                  } cada, a partir de{' '}
                  {dueDate
                    ? new Date(dueDate + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
                    : '—'
                  }, todos como pendentes.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="btn-save" onClick={handleSubmit} disabled={saving}>
            {saving
              ? 'Salvando...'
              : isEditing
                ? 'Salvar alterações'
                : useInstallments
                  ? `Criar ${installments} parcelas`
                  : 'Adicionar lançamento'
            }
          </button>
        </div>
      </div>
    </div>
  )
}
