import { useState, useEffect, useMemo } from 'react'
import { db } from './firebase'
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, query, where, onSnapshot, orderBy, Timestamp
} from 'firebase/firestore'
import { CategoriesProvider, useCategories } from './CategoriesContext'
import TransactionModal from './components/TransactionModal'
import ConstructionTransactionModal from './components/ConstructionTransactionModal'
import LoginScreen from './components/LoginScreen'
import MonthPicker from './components/MonthPicker'
import Summary from './components/Summary'
import CategoryCharts from './components/CategoryCharts'
import TransactionList from './components/TransactionList'
import SettingsModal from './components/SettingsModal'
import './App.css'

const FILTER_OPTIONS = [
  { key: 'all', label: 'Tudo' },
  { key: 'receita', label: 'Receitas' },
  { key: 'despesa', label: 'Despesas' },
  { key: 'pago', label: 'Pagas' },
  { key: 'pendente', label: 'Pendentes' },
  { key: 'atrasado', label: 'Atrasadas' },
]

function FinanceApp() {
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [monthPickerOpen, setMonthPickerOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [totalConstruction, setTotalConstruction] = useState(0)

  const { currentAccount, setCurrentAccount } = useCategories()
  const [users, setUsers] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [userAuthLoading, setUserAuthLoading] = useState(true)

  // Escuta usuários em tempo real
  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      setUsers(list)
      
      const savedUserId = localStorage.getItem('fin_current_user_id')
      const found = list.find(u => u.id === savedUserId)
      if (found) {
        setCurrentUser(found)
      } else {
        setCurrentUser(null)
      }
      setUserAuthLoading(false)
    }, (err) => {
      console.error(err)
      setUserAuthLoading(false)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (currentAccount !== 'construcao') return
    const q = query(collection(db, 'transactions'))
    const unsub = onSnapshot(q, (snapshot) => {
      let sum = 0
      snapshot.docs.forEach(d => {
        const data = d.data()
        if (data.account === 'construcao' && data.type === 'despesa') {
          if (filter === 'all' || data.category === filter) {
            sum += (data.value || 0)
          }
        }
      })
      setTotalConstruction(sum)
    })
    return () => unsub()
  }, [currentAccount, filter])

  const activeUser = useMemo(() => {
    return currentUser || {
      username: 'Usuário Padrão',
      email: 'admin@financas.com',
      profile: 'Administrador',
      photo: ''
    }
  }, [currentUser])

  useEffect(() => {
    let q;
    if (showAll) {
      q = query(
        collection(db, 'transactions'),
        orderBy('dueDate', 'asc')
      )
    } else {
      const start = new Date(currentYear, currentMonth, 1)
      const end = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59)
      q = query(
        collection(db, 'transactions'),
        where('dueDate', '>=', Timestamp.fromDate(start)),
        where('dueDate', '<=', Timestamp.fromDate(end)),
        orderBy('dueDate', 'asc')
      )
    }

    const unsub = onSnapshot(q, (snapshot) => {
      setTransactions(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return () => unsub()
  }, [currentYear, currentMonth, showAll])

  // Filtra transações por conta e enriquece com status de atraso
  const enriched = useMemo(() => {
    const now = new Date()
    return transactions
      .filter(t => {
        if (currentAccount === 'pessoal') {
          return !t.account || t.account === 'pessoal'
        }
        return t.account === currentAccount
      })
      .map(t => {
        if (t.status === 'pago') return t
        const due = t.dueDate?.toDate ? t.dueDate.toDate() : new Date(t.dueDate)
        return { ...t, computedStatus: due < now ? 'atrasado' : 'pendente' }
      })
  }, [transactions, currentAccount])

  const filtered = useMemo(() => {
    if (filter === 'all') return enriched
    if (filter === 'receita') return enriched.filter(t => t.type === 'receita')
    if (filter === 'despesa') return enriched.filter(t => t.type === 'despesa')
    if (filter === 'pago') return enriched.filter(t => t.status === 'pago')
    if (filter === 'pendente') return enriched.filter(t => (t.computedStatus || t.status) === 'pendente')
    if (filter === 'atrasado') return enriched.filter(t => (t.computedStatus || t.status) === 'atrasado')
    return enriched.filter(t => t.category === filter)
  }, [enriched, filter])

  const navigateMonth = (dir) => {
    let m = currentMonth + dir
    let y = currentYear
    if (m > 11) { m = 0; y++ }
    if (m < 0) { m = 11; y-- }
    setCurrentMonth(m); setCurrentYear(y)
  }

  const handleSave = async (data) => {
    const targetAccount = currentAccount
    if (data.installments > 1) {
      const promises = []
      for (let i = 0; i < data.installments; i++) {
        const dueDate = new Date(data.dueDate.toDate())
        dueDate.setMonth(dueDate.getMonth() + i)
        promises.push(addDoc(collection(db, 'transactions'), {
          ...data,
          account: targetAccount,
          dueDate: Timestamp.fromDate(dueDate),
          installmentNum: i + 1, installmentTotal: data.installments,
          installments: 1, status: 'pendente', createdAt: Timestamp.now()
        }))
      }
      await Promise.all(promises)
    } else if (editing) {
      const { id, computedStatus, ...rest } = data
      await updateDoc(doc(db, 'transactions', editing.id), {
        ...rest,
        account: editing.account || targetAccount
      })
    } else {
      await addDoc(collection(db, 'transactions'), {
        ...data,
        account: targetAccount,
        createdAt: Timestamp.now()
      })
    }
    setModalOpen(false); setEditing(null)
  }

  const handleDelete = async (id) => {
    if (!confirm('Excluir este lançamento?')) return
    await deleteDoc(doc(db, 'transactions', id))
  }

  const handleMarkPaid = async (t) => {
    await updateDoc(doc(db, 'transactions', t.id), {
      status: 'pago', paymentDate: Timestamp.now()
    })
  }

  const monthLabel = new Date(currentYear, currentMonth, 1)
    .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  if (userAuthLoading) {
    return (
      <div className="login-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <i className="ti ti-loader" style={{ fontSize: 36, animation: 'spin 1s linear infinite', color: 'var(--green)' }} aria-hidden="true" />
        <span style={{ marginTop: 15, fontSize: 14, fontWeight: 600, color: '#666' }}>Carregando...</span>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <LoginScreen 
        onLogin={(user) => {
          setCurrentUser(user)
          localStorage.setItem('fin_current_user_id', user.id)
        }} 
      />
    )
  }

  return (
    <div className="app">
      <div className="top-bar">
        <div className="logo">
          <i className="ti ti-wallet" aria-hidden="true" />
          Finanças
        </div>

        <div className="month-nav">
          <button className="nav-btn" onClick={() => navigateMonth(-1)} aria-label="Mês anterior" disabled={showAll}>
            <i className="ti ti-chevron-left" aria-hidden="true" />
          </button>
          <button className="month-label" onClick={() => !showAll && setMonthPickerOpen(true)} disabled={showAll}>
            {showAll ? 'Todos os Meses' : monthLabel}
          </button>
          <button className="nav-btn" onClick={() => navigateMonth(1)} aria-label="Próximo mês" disabled={showAll}>
            <i className="ti ti-chevron-right" aria-hidden="true" />
          </button>
        </div>

        <div className="top-bar-right">
          <div 
            className="user-profile-header"
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
          >
            {activeUser.photo ? (
              <img src={activeUser.photo} alt={activeUser.username} className="header-avatar" />
            ) : (
              <div className="header-avatar-placeholder">
                {activeUser.username ? activeUser.username.charAt(0) : 'U'}
              </div>
            )}
          </div>

          {userDropdownOpen && (
            <>
              <div className="user-dropdown-backdrop" onClick={() => setUserDropdownOpen(false)} />
              <div className="user-dropdown" role="menu">
                <div className="user-dropdown-info">
                  <span className="dropdown-username">{activeUser.username}</span>
                  <span className="dropdown-email">{activeUser.email}</span>
                  <span className={`user-badge ${(activeUser.profile || '').toLowerCase()}`}>
                    {activeUser.profile}
                  </span>
                </div>

                <div 
                  className="user-dropdown-opt settings-opt" 
                  onClick={() => { setSettingsOpen(true); setUserDropdownOpen(false) }}
                >
                  <i className="ti ti-settings" aria-hidden="true" />
                  <span>Configurações</span>
                </div>

                <div className="dropdown-divider" />

                <div 
                  className="user-dropdown-opt logout-opt" 
                  onClick={() => {
                    setCurrentUser(null)
                    localStorage.removeItem('fin_current_user_id')
                    setUserDropdownOpen(false)
                  }}
                  style={{ color: '#b83a16' }}
                >
                  <i className="ti ti-logout" aria-hidden="true" style={{ color: '#b83a16' }} />
                  <span>Sair</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <Summary 
        transactions={enriched} 
        filteredTransactions={filtered}
        currentAccount={currentAccount} 
        totalConstruction={totalConstruction} 
        activeFilter={filter} 
      />
      <CategoryCharts transactions={enriched} currentAccount={currentAccount} />

      <div className="filter-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {currentAccount === 'construcao' ? (
            <>
              <button className={`filter-btn${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>Tudo</button>
              {Array.from(new Set(enriched.map(t => t.category).filter(Boolean))).map(cat => (
                <button
                  key={cat}
                  className={`filter-btn${filter === cat ? ' active' : ''}`}
                  onClick={() => setFilter(cat)}
                >{cat}</button>
              ))}
            </>
          ) : (
            FILTER_OPTIONS.map(f => (
              <button
                key={f.key}
                className={`filter-btn${filter === f.key ? ' active' : ''}`}
                onClick={() => setFilter(f.key)}
              >{f.label}</button>
            ))
          )}
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', color: '#555', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <input 
            type="checkbox" 
            checked={showAll} 
            onChange={e => setShowAll(e.target.checked)} 
            style={{ width: 16, height: 16, accentColor: 'var(--blue)' }}
          />
          Mostrar Tudo
        </label>
      </div>

      <TransactionList
        transactions={filtered}
        loading={loading}
        currentAccount={currentAccount}
        onEdit={t => { setEditing(t); setModalOpen(true) }}
        onDelete={handleDelete}
        onMarkPaid={handleMarkPaid}
      />

      {modalOpen && (
        currentAccount === 'construcao' ? (
          <ConstructionTransactionModal
            initial={editing}
            currentMonth={currentMonth}
            currentYear={currentYear}
            onSave={handleSave}
            onClose={() => { setModalOpen(false); setEditing(null) }}
          />
        ) : (
          <TransactionModal
            initial={editing}
            currentMonth={currentMonth}
            currentYear={currentYear}
            onSave={handleSave}
            onClose={() => { setModalOpen(false); setEditing(null) }}
          />
        )
      )}

      {monthPickerOpen && (
        <MonthPicker
          year={currentYear} month={currentMonth}
          onSelect={(y, m) => { setCurrentYear(y); setCurrentMonth(m); setMonthPickerOpen(false) }}
          onClose={() => setMonthPickerOpen(false)}
        />
      )}

      {settingsOpen && (
        <SettingsModal onClose={() => setSettingsOpen(false)} />
      )}

      {/* Menu Fixo Inferior */}
      <div className="bottom-nav">
        <button 
          className={`bottom-nav-btn${currentAccount === 'pessoal' ? ' active' : ''}`}
          onClick={() => setCurrentAccount('pessoal')}
        >
          <i className="ti ti-wallet" aria-hidden="true" />
          <span>Finanças Pessoais</span>
        </button>
        <button 
          className={`bottom-nav-btn${currentAccount === 'construcao' ? ' active' : ''}`}
          onClick={() => setCurrentAccount('construcao')}
        >
          <i className="ti ti-hammer" aria-hidden="true" />
          <span>Construção</span>
        </button>
        <button 
          className="bottom-nav-btn"
          onClick={() => setSettingsOpen(true)}
        >
          <i className="ti ti-settings" aria-hidden="true" />
          <span>Configurações</span>
        </button>
      </div>

      {/* Botão de Lançamento Flutuante no Mobile */}
      <button 
        className="fab-add-btn" 
        onClick={() => { setEditing(null); setModalOpen(true) }}
        aria-label="Novo lançamento"
      >
        <i className="ti ti-plus" aria-hidden="true" />
      </button>
    </div>
  )
}

export default function App() {
  return (
    <CategoriesProvider>
      <FinanceApp />
    </CategoriesProvider>
  )
}
