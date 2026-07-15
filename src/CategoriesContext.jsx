// src/CategoriesContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'
import { db } from './firebase'
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore'

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
  const [categories, setCategories] = useState([])
  const [currentAccount, setCurrentAccount] = useState(() =>
    localStorage.getItem('fin_current_account') || 'pessoal'
  )

  useEffect(() => {
    localStorage.setItem('fin_current_account', currentAccount)
  }, [currentAccount])

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'categories'), snapshot => {
      if (snapshot.empty) {
        // Migrar do localStorage ou usar defaults na primeira vez
        const loadLocal = (key, def) => {
          try {
            const raw = localStorage.getItem(key)
            return raw ? JSON.parse(raw) : def
          } catch { return def }
        }
        
        const pExp = loadLocal('fin_expense_cats', DEFAULT_EXPENSE_CATEGORIES)
        const pInc = loadLocal('fin_income_cats', DEFAULT_INCOME_CATEGORIES)
        const cExp = loadLocal('fin_const_expense_cats', DEFAULT_CONST_EXPENSE_CATEGORIES)
        const cInc = loadLocal('fin_const_income_cats', DEFAULT_CONST_INCOME_CATEGORIES)

        const batchSeed = (list, type, account) => {
          list.forEach(c => {
             const docId = c.id || Math.random().toString(36).substring(2, 9)
             setDoc(doc(db, 'categories', `${account}_${type}_${docId}`), {
               name: c.name, color: c.color, icon: c.icon, type, account
             })
          })
        }
        
        batchSeed(pExp, 'despesa', 'pessoal')
        batchSeed(pInc, 'receita', 'pessoal')
        batchSeed(cExp, 'despesa', 'construcao')
        batchSeed(cInc, 'receita', 'construcao')
      } else {
        setCategories(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
      }
    })
    return () => unsub()
  }, [])

  const expenseCategories = categories.filter(c => c.type === 'despesa' && c.account === currentAccount)
  const incomeCategories = categories.filter(c => c.type === 'receita' && c.account === currentAccount)

  const addCategory = async (type, cat) => {
    await addDoc(collection(db, 'categories'), {
      name: cat.name,
      color: cat.color,
      icon: cat.icon,
      type,
      account: currentAccount
    })
  }

  const updateCategory = async (type, cat) => {
    const { id, ...rest } = cat
    await updateDoc(doc(db, 'categories', id), {
      name: rest.name,
      color: rest.color,
      icon: rest.icon,
    })
  }

  const deleteCategory = async (type, id) => {
    await deleteDoc(doc(db, 'categories', id))
  }

  const getCategoryMeta = (type, name) => {
    const list = categories.filter(c => c.type === type && c.account === currentAccount)
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
