import { EscrowLink, Transaction } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export type DashboardData = {
  metrics: {
    title: string;
    value: string;
    description: string;
  }[];
  activeEscrows: EscrowLink[];
  transactions: Transaction[];
};

export function useDashboardData(address: string | undefined) {
  return useQuery<DashboardData>({
    queryKey: ["dashboard", address],
    queryFn: async () => {
      if (!address) throw new Error("No address provided");
      const { data } = await axios.get(`/api/dashboard?address=${address}`);
      return data;
    },
    // Only run the query if the user's wallet address is available
    enabled: !!address,
  });
}
