// src/CategoriesContext.jsx
// Gerencia categorias em localStorage (sem depender do Firestore para agilidade)
import { createContext, useContext, useState, useEffect } from 'react'

const DEFAULT_EXPENSE_CATEGORIES = [
  { id: 'moradia', name: 'Moradia', color: '#D85A30', icon: 'ti-home' },
  { id: 'alimentacao', name: 'Alimentação', color: '#378ADD', icon: 'ti-tools-kitchen-2' },
  { id: 'transporte', name: 'Transporte', color: '#BA7517', icon: 'ti-car' },
  { id: 'saude', name: 'Saúde', color: '#7F77DD', icon: 'ti-heart' },
  { id: 'lazer', name: 'Lazer', color: '#1D9E75', icon: 'ti-device-gamepad' },
  { id: 'educacao', name: 'Educação', color: '#D4537E', icon: 'ti-school' },
  { id: 'outros_d', name: 'Outros', color: '#888780', icon: 'ti-dots' },
]

const DEFAULT_INCOME_CATEGORIES = [
  { id: 'salario', name: 'Salário', color: '#1D9E75', icon: 'ti-briefcase' },
  { id: 'freelance', name: 'Freelance', color: '#378ADD', icon: 'ti-code' },
  { id: 'investimentos', name: 'Investimentos', color: '#7F77DD', icon: 'ti-trending-up' },
  { id: 'outros_r', name: 'Outros', color: '#888780', icon: 'ti-dots' },
]

const DEFAULT_CONST_EXPENSE_CATEGORIES = [
  { id: 'mat_alvenaria', name: 'Material (Alvenaria)', color: '#BA7517', icon: 'ti-building' },
  { id: 'mat_acabamento', name: 'Material (Acabamento)', color: '#378ADD', icon: 'ti-paint' },
  { id: 'mao_de_obra', name: 'Mão de Obra', color: '#D85A30', icon: 'ti-users' },
  { id: 'equipamentos', name: 'Equipamentos/Ferramentas', color: '#7F77DD', icon: 'ti-tools' },
  { id: 'projetos_doc', name: 'Projetos/Documentação', color: '#1D9E75', icon: 'ti-file-text' },
  { id: 'outros_const', name: 'Outros', color: '#888780', icon: 'ti-dots' },
]

const DEFAULT_CONST_INCOME_CATEGORIES = [
  { id: 'aportes', name: 'Aportes/Recursos', color: '#1D9E75', icon: 'ti-pig-money' },
  { id: 'financiamento', name: 'Financiamento', color: '#378ADD', icon: 'ti-building-bank' },
  { id: 'outros_r_const', name: 'Outros', color: '#888780', icon: 'ti-dots' },
]

const CategoriesContext = createContext(null)

export function CategoriesProvider({ children }) {
  const load = (key, def) => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : def
    } catch { return def }
  }

  // Estados separados para as duas contas
  const [personalExpenseCats, setPersonalExpenseCats] = useState(() =>
    load('fin_expense_cats', DEFAULT_EXPENSE_CATEGORIES)
  )
  const [personalIncomeCats, setPersonalIncomeCats] = useState(() =>
    load('fin_income_cats', DEFAULT_INCOME_CATEGORIES)
  )
  const [constExpenseCats, setConstExpenseCats] = useState(() =>
    load('fin_const_expense_cats', DEFAULT_CONST_EXPENSE_CATEGORIES)
  )
  const [constIncomeCats, setConstIncomeCats] = useState(() =>
    load('fin_const_income_cats', DEFAULT_CONST_INCOME_CATEGORIES)
  )

  const [currentAccount, setCurrentAccount] = useState(() =>
    localStorage.getItem('fin_current_account') || 'pessoal'
  )

  useEffect(() => {
    localStorage.setItem('fin_current_account', currentAccount)
  }, [currentAccount])

  useEffect(() => {
    localStorage.setItem('fin_expense_cats', JSON.stringify(personalExpenseCats))
  }, [personalExpenseCats])

  useEffect(() => {
    localStorage.setItem('fin_income_cats', JSON.stringify(personalIncomeCats))
  }, [personalIncomeCats])

  useEffect(() => {
    localStorage.setItem('fin_const_expense_cats', JSON.stringify(constExpenseCats))
  }, [constExpenseCats])

  useEffect(() => {
    localStorage.setItem('fin_const_income_cats', JSON.stringify(constIncomeCats))
  }, [constIncomeCats])

  // Resolve as categorias ativas dinamicamente
  const expenseCategories = currentAccount === 'pessoal' ? personalExpenseCats : constExpenseCats
  const incomeCategories = currentAccount === 'pessoal' ? personalIncomeCats : constIncomeCats

  const addCategory = (type, cat) => {
    const newCat = { ...cat, id: `cat_${Date.now()}` }
    if (currentAccount === 'pessoal') {
      if (type === 'despesa') setPersonalExpenseCats(prev => [...prev, newCat])
      else setPersonalIncomeCats(prev => [...prev, newCat])
    } else {
      if (type === 'despesa') setConstExpenseCats(prev => [...prev, newCat])
      else setConstIncomeCats(prev => [...prev, newCat])
    }
  }

  const updateCategory = (type, cat) => {
    if (currentAccount === 'pessoal') {
      if (type === 'despesa') setPersonalExpenseCats(prev => prev.map(c => c.id === cat.id ? cat : c))
      else setPersonalIncomeCats(prev => prev.map(c => c.id === cat.id ? cat : c))
    } else {
      if (type === 'despesa') setConstExpenseCats(prev => prev.map(c => c.id === cat.id ? cat : c))
      else setConstIncomeCats(prev => prev.map(c => c.id === cat.id ? cat : c))
    }
  }

  const deleteCategory = (type, id) => {
    if (currentAccount === 'pessoal') {
      if (type === 'despesa') setPersonalExpenseCats(prev => prev.filter(c => c.id !== id))
      else setPersonalIncomeCats(prev => prev.filter(c => c.id !== id))
    } else {
      if (type === 'despesa') setConstExpenseCats(prev => prev.filter(c => c.id !== id))
      else setConstIncomeCats(prev => prev.filter(c => c.id !== id))
    }
  }

  const getCategoryMeta = (type, name) => {
    const list = type === 'receita' ? incomeCategories : expenseCategories
    return list.find(c => c.name === name) || { color: '#888780', icon: 'ti-dots' }
  }

  return (
    <CategoriesContext.Provider value={{
      currentAccount, setCurrentAccount,
      expenseCategories, incomeCategories,
      addCategory, updateCategory, deleteCategory, getCategoryMeta
    }}>
      {children}
    </CategoriesContext.Provider>
  )
}

export const useCategories = () => useContext(CategoriesContext)
