import { useQuery } from "@tanstack/react-query";
import axios from "axios";

import { EscrowLink } from "@/lib/types";

export function useGetEscrow(id: string) {
  return useQuery({
    queryKey: ["escrow", id],
    queryFn: async () => {
      const response = await axios.get<{ escrow: EscrowLink }>(
        `/api/escrows/${id}`,
      );
      return response.data.escrow;
    },
    enabled: !!id,
    retry: 1,
  });
}
