import { useState } from 'react'

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril',
  'Maio', 'Junho', 'Julho', 'Agosto',
  'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export default function MonthPicker({ year, month, onSelect, onClose }) {
  const [pickYear, setPickYear] = useState(year)

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 360 }} role="dialog" aria-modal="true" aria-label="Selecionar período">
        <div className="modal-header">
          <div className="modal-title">Selecionar período</div>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">
            <i className="ti ti-x" aria-hidden="true" />
          </button>
        </div>

        <div className="year-nav">
          <button className="nav-btn" onClick={() => setPickYear(y => y - 1)} aria-label="Ano anterior">
            <i className="ti ti-chevron-left" aria-hidden="true" />
          </button>
          <span className="year-val">{pickYear}</span>
          <button className="nav-btn" onClick={() => setPickYear(y => y + 1)} aria-label="Próximo ano">
            <i className="ti ti-chevron-right" aria-hidden="true" />
          </button>
        </div>

        <div className="month-picker-grid">
          {MONTHS.map((m, i) => (
            <button
              key={i}
              className={`mp-btn${pickYear === year && i === month ? ' active' : ''}`}
              onClick={() => onSelect(pickYear, i)}
            >
              {m.slice(0, 3)}
            </button>
          ))}
        </div>

        <div style={{ height: '.5rem' }} />
      </div>
    </div>
  )
}
