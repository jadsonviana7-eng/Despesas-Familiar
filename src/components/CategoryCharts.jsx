import { useCategories } from '../CategoriesContext'

const fmt = (v) => {
  if (v >= 1000) return 'R$' + (v / 1000).toFixed(1) + 'k'
  return 'R$' + v.toFixed(0)
}

function CategoryBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="bar-row">
      <div className="bar-label">
        <span className="cat-dot" style={{ background: color }} />
        {label}
      </div>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="bar-val">{fmt(value)}</div>
    </div>
  )
}

export default function CategoryCharts({ transactions, currentAccount }) {
  const { getCategoryMeta } = useCategories()

  const buildMap = (type) => {
    const map = {}
    transactions.filter(t => t.type === type).forEach(t => {
      const cat = t.category || 'Outros'
      map[cat] = (map[cat] || 0) + (t.value || 0)
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6)
  }

  const despesasCats = buildMap('despesa')
  const receitasCats = buildMap('receita')
  const maxD = Math.max(...despesasCats.map(([, v]) => v), 1)
  const maxR = Math.max(...receitasCats.map(([, v]) => v), 1)

  if (despesasCats.length === 0 && receitasCats.length === 0) return null

  if (currentAccount === 'construcao') {
    return (
      <div className="charts-row" style={{ gridTemplateColumns: '1fr' }}>
        <div className="chart-card">
          <div className="chart-title">Despesas por categoria</div>
          <div className="bar-wrap">
            {despesasCats.length === 0
              ? <div style={{ color: '#777', fontSize: 13, fontWeight: 500 }}>Sem despesas neste período</div>
              : despesasCats.map(([cat, val]) => (
                <CategoryBar key={cat} label={cat} value={val} max={maxD}
                  color={getCategoryMeta('despesa', cat).color} />
              ))
            }
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="charts-row">
      <div className="chart-card">
        <div className="chart-title">Despesas por categoria</div>
        <div className="bar-wrap">
          {despesasCats.length === 0
            ? <div style={{ color: '#777', fontSize: 13, fontWeight: 500 }}>Sem despesas neste mês</div>
            : despesasCats.map(([cat, val]) => (
              <CategoryBar key={cat} label={cat} value={val} max={maxD}
                color={getCategoryMeta('despesa', cat).color} />
            ))
          }
        </div>
      </div>
      <div className="chart-card">
        <div className="chart-title">Receitas por categoria</div>
        <div className="bar-wrap">
          {receitasCats.length === 0
            ? <div style={{ color: '#777', fontSize: 13, fontWeight: 500 }}>Sem receitas neste mês</div>
            : receitasCats.map(([cat, val]) => (
              <CategoryBar key={cat} label={cat} value={val} max={maxR}
                color={getCategoryMeta('receita', cat).color} />
            ))
          }
        </div>
      </div>
    </div>
  )
}
