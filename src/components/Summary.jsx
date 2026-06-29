const fmt = (v) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })

export default function Summary({ transactions }) {
  const receitas = transactions.filter(t => t.type === 'receita')
  const despesas = transactions.filter(t => t.type === 'despesa')

  const totalReceitas = receitas.reduce((s, t) => s + (t.value || 0), 0)
  const totalDespesas = despesas.reduce((s, t) => s + (t.value || 0), 0)
  const saldo = totalReceitas - totalDespesas

  const pendentes = transactions.filter(t =>
    (t.computedStatus || t.status) !== 'pago' && t.type === 'despesa'
  )
  const totalPendente = pendentes.reduce((s, t) => s + (t.value || 0), 0)

  const atrasados = transactions.filter(t => (t.computedStatus || t.status) === 'atrasado')
  const pagas = transactions.filter(t => t.status === 'pago')

  return (
    <div className="summary-grid">
      <div className="sum-card">
        <div className="sum-label">
          <i className="ti ti-trending-up" style={{ color: '#1D9E75' }} aria-hidden="true" />
          Receitas
        </div>
        <div className="sum-val green">R$ {fmt(totalReceitas)}</div>
        <div className="sum-sub">{receitas.length} lançamento{receitas.length !== 1 ? 's' : ''}</div>
      </div>

      <div className="sum-card">
        <div className="sum-label">
          <i className="ti ti-trending-down" style={{ color: '#D85A30' }} aria-hidden="true" />
          Despesas
        </div>
        <div className="sum-val red">R$ {fmt(totalDespesas)}</div>
        <div className="sum-sub">{despesas.length} lançamento{despesas.length !== 1 ? 's' : ''}</div>
      </div>

      <div className="sum-card">
        <div className="sum-label">
          <i className="ti ti-scale" style={{ color: '#378ADD' }} aria-hidden="true" />
          Saldo
        </div>
        <div className={`sum-val ${saldo >= 0 ? 'blue' : 'red'}`}>
          {saldo < 0 ? '− ' : ''}R$ {fmt(Math.abs(saldo))}
        </div>
        <div className="sum-sub">
          {pagas.length} pago{pagas.length !== 1 ? 's' : ''} · {atrasados.length} atrasado{atrasados.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="sum-card">
        <div className="sum-label">
          <i className="ti ti-clock" style={{ color: '#BA7517' }} aria-hidden="true" />
          Pendentes
        </div>
        <div className="sum-val amber">R$ {fmt(totalPendente)}</div>
        <div className="sum-sub">{pendentes.length} conta{pendentes.length !== 1 ? 's' : ''} a pagar</div>
      </div>
    </div>
  )
}
