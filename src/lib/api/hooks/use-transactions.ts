import { useQuery } from "@tanstack/react-query";
import axios from "axios";

import { Transaction, TransactionType } from "@/lib/types";

// Extend the base type to account for the joined Prisma relation
export type TransactionWithProject = Transaction & {
  escrowLink?: {
    projectTitle: string;
  };
};

export function useGetTransactions(
  typeFilter: TransactionType | "ALL",
  address?: string,
) {
  return useQuery({
    queryKey: ["transactions", typeFilter, address],
    queryFn: async () => {
      const response = await axios.get<{
        transactions: TransactionWithProject[];
      }>("/api/transactions", { params: { type: typeFilter, address } });
      return response.data.transactions;
    },
    enabled: !!address,
  });
}
