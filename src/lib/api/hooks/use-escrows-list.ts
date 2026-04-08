import type { EscrowLink } from "@/lib/types"; // Or wherever your types are exported
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export function useEscrowsList(
  address: string | undefined,
  search: string,
  status: string,
) {
  return useQuery<{ escrows: EscrowLink[] }>({
    // Adding search and status to the queryKey ensures React Query
    // automatically refetches and caches unique combinations
    queryKey: ["escrows-list", address, search, status],
    queryFn: async () => {
      if (!address) throw new Error("No address provided");

      const params = new URLSearchParams({ address });
      if (search) params.append("search", search);
      if (status !== "ALL") params.append("status", status);

      const { data } = await axios.get(`/api/escrows?${params.toString()}`);
      return data;
    },
    enabled: !!address, // Prevent running if wallet isn't connected
  });
}
