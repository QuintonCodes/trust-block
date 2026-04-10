import { useQuery } from "@tanstack/react-query";
import axios from "axios";

import { Transaction, TransactionType } from "@/lib/types";

// Extend the base type to account for the joined Prisma relation
export type TransactionWithProject = Transaction & {
  escrowLink?: {
    projectTitle: string;
  };
};

export function useGetTransactions(typeFilter: TransactionType | "ALL") {
  return useQuery({
    queryKey: ["transactions", typeFilter],
    queryFn: async () => {
      const response = await axios.get<{
        transactions: TransactionWithProject[];
      }>("/api/transactions", { params: { type: typeFilter } });
      return response.data.transactions;
    },
  });
}
