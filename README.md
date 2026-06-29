# 💰 Finanças Pessoais

Aplicação React + Firebase Firestore para controle financeiro pessoal com receitas, despesas, categorias, parcelas e muito mais.

---

## ✅ Funcionalidades

- **Navegação por mês** — setas esquerda/direita + clique no mês para selecionar período
- **Resumo rico** — cartões de receitas, despesas, saldo e pendentes
- **Gráficos de categorias** — barras horizontais para despesas e receitas por categoria
- **Filtros** — tudo, receitas, despesas, pagas, pendentes, atrasadas
- **Lista completa** — colunas: descrição, vencimento, pagamento, valor, status, ações
- **Status automático** — lançamentos vencidos viram "Atrasado" automaticamente
- **Editar / Excluir** — botões inline em cada linha
- **Marcar como pago** — botão ✓ direto na lista
- **Parcelas** — ao criar uma despesa, ative "Parcelar" e escolha 2x a 24x; os lançamentos são criados automaticamente nos meses seguintes, todos como pendentes

---

## 🚀 Como usar

### 1. Configure o Firebase

Acesse [console.firebase.google.com](https://console.firebase.google.com) e:

1. Crie um projeto (ou use um existente)
2. Vá em **Project settings → Your apps → Web app (ícone `</>`)**
3. Copie o `firebaseConfig`
4. Cole em **`src/firebase.js`** substituindo os valores de exemplo

### 2. Configure o Firestore

No console do Firebase:
1. Vá em **Firestore Database → Create database**
2. Escolha **"Start in test mode"** (para desenvolvimento)
3. Selecione a região mais próxima (ex: `southamerica-east1`)

**Índice composto necessário:**
O Firestore vai pedir que você crie um índice na primeira consulta. Clique no link que aparece no console do navegador, ou crie manualmente:

- Coleção: `transactions`
- Campo 1: `dueDate` — Ascending
- Campo 2: `dueDate` — Ascending

### 3. Instale e rode

```bash
npm install
npm run dev
```

Acesse em `http://localhost:5173`

---

## 🗄️ Estrutura do documento no Firestore

Coleção: **`transactions`**

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | string | Auto-gerado pelo Firestore |
| `type` | string | `"receita"` ou `"despesa"` |
| `description` | string | Descrição do lançamento |
| `category` | string | Categoria (ex: Moradia, Salário) |
| `value` | number | Valor em reais |
| `dueDate` | Timestamp | Data de vencimento |
| `paymentDate` | Timestamp \| null | Data de pagamento (null se pendente) |
| `status` | string | `"pendente"` ou `"pago"` |
| `installmentNum` | number? | Número da parcela (1, 2, 3...) |
| `installmentTotal` | number? | Total de parcelas |
| `createdAt` | Timestamp | Data de criação |

---

## 📁 Estrutura do projeto

```
src/
  App.jsx                    # Componente principal + lógica Firestore
  App.css                    # Estilos completos (light/dark mode)
  firebase.js                # Configuração Firebase — EDITE AQUI
  main.jsx                   # Entry point React
  components/
    Summary.jsx              # Cards de resumo (receitas, despesas, saldo, pendentes)
    CategoryCharts.jsx       # Gráficos de barras por categoria
    TransactionList.jsx      # Tabela de lançamentos com ações
    TransactionModal.jsx     # Modal para criar/editar + sistema de parcelas
    MonthPicker.jsx          # Seletor visual de mês/ano
```

---

## 🔐 Regras do Firestore (produção)

Para produção, substitua as regras do Firestore por:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /transactions/{doc} {
      allow read, write: if request.auth != null;
    }
  }
}
```

E configure autenticação (Firebase Auth) no projeto.
