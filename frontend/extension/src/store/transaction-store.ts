import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Transaction } from '../types/transaction';

interface TransactionState {
  transactions: Transaction[];
  currentTransaction: Transaction | null;
  
  // Actions
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  setCurrentTransaction: (transaction: Transaction | null) => void;
  clearTransactions: () => void;
}

export const useTransactionStore = create<TransactionState>()(
  immer((set) => ({
    transactions: [],
    currentTransaction: null,

    addTransaction: (transaction) =>
      set((state) => {
        state.transactions.unshift(transaction);
        // Keep only last 100 transactions
        if (state.transactions.length > 100) {
          state.transactions = state.transactions.slice(0, 100);
        }
      }),

    updateTransaction: (id, updates) =>
      set((state) => {
        const index = state.transactions.findIndex((t) => t.id === id);
        if (index !== -1) {
          state.transactions[index] = { ...state.transactions[index], ...updates };
        }
      }),

    setCurrentTransaction: (transaction) =>
      set((state) => {
        state.currentTransaction = transaction;
      }),

    clearTransactions: () =>
      set((state) => {
        state.transactions = [];
      }),
  }))
);

