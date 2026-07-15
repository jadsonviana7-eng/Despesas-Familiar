import { useState } from 'react'
import { Timestamp } from 'firebase/firestore'
import { useCategories } from '../CategoriesContext'

const toInputDate = (ts) => {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toISOString().slice(0, 10)
}

export default function ConstructionTransactionModal({ initial, currentMonth, currentYear, onSave, onClose }) {
  const { expenseCategories } = useCategories()
  const isEditing = !!initial

  const defaultDate = new Date(currentYear, currentMonth, new Date().getDate())
    .toISOString().slice(0, 10)

  const [description, setDescription] = useState(initial?.description || '')
  const [category, setCategory] = useState(initial?.category || '')
  
  const [qtd, setQtd] = useState(initial?.qtd?.toString() || '1')
  const [valorUnit, setValorUnit] = useState(initial?.valorUnit?.toString() || '')
  
  const [dueDate, setDueDate] = useState(initial ? toInputDate(initial.dueDate) : defaultDate)
  const [saving, setSaving] = useState(false)

  // Calculate total automatically
  const parsedQtd = parseFloat(qtd.replace(',', '.')) || 0
  const parsedValorUnit = parseFloat(valorUnit.replace(',', '.')) || 0
  const computedTotal = parsedQtd * parsedValorUnit

  const handleSubmit = async () => {
    if (!description.trim()) return alert('Informe a descrição.')
    if (computedTotal <= 0) return alert('Informe quantidade e valor unitário válidos.')
    if (!dueDate) return alert('Informe a data.')

    setSaving(true)
    try {
      const data = {
        type: 'despesa',
        description: description.trim(),
        category: category || 'Outros',
        value: computedTotal,
        qtd: parsedQtd,
        valorUnit: parsedValorUnit,
        dueDate: Timestamp.fromDate(new Date(dueDate + 'T12:00:00')),
        paymentDate: Timestamp.fromDate(new Date(dueDate + 'T12:00:00')), // Auto-paid
        status: 'pago',
        installments: 1,
      }
      if (isEditing) {
        data.id = initial.id
      }
      await onSave(data)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" role="dialog" aria-modal="true" aria-label="Lançamento de Construção">
        <div className="modal-header">
          <div className="modal-title">{isEditing ? 'Editar lançamento (Construção)' : 'Novo lançamento (Construção)'}</div>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">
            <i className="ti ti-x" aria-hidden="true" />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-row">
            <div className="form-group full">
              <label htmlFor="mdesc">Descrição</label>
              <input id="mdesc" type="text" placeholder="Ex: Areia grossa, Cimento..."
                value={description} onChange={e => setDescription(e.target.value)} autoFocus />
            </div>

            <div className="form-group">
              <label htmlFor="mcat">Categoria</label>
              <select id="mcat" value={category} onChange={e => setCategory(e.target.value)}>
                <option value="">Selecione...</option>
                {expenseCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="mdue">Data</label>
              <input id="mdue" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>

            <div className="form-group">
              <label htmlFor="mqtd">Qtd.</label>
              <input id="mqtd" type="number" min="0" step="0.01" placeholder="1"
                value={qtd} onChange={e => setQtd(e.target.value)} />
            </div>

            <div className="form-group">
              <label htmlFor="mvalunit">Valor Unitário (R$)</label>
              <input id="mvalunit" type="number" min="0" step="0.01" placeholder="0,00"
                value={valorUnit} onChange={e => setValorUnit(e.target.value)} />
            </div>

            <div className="form-group">
              <label htmlFor="mvaltot">Valor Total (R$)</label>
              <input id="mvaltot" type="text" disabled
                value={computedTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="btn-save" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}
