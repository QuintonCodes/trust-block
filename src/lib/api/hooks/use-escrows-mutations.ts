import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

import { CreateEscrowInput, EscrowStatus } from "@/lib/types";

export function useCreateEscrowDb() {
  return useMutation({
    mutationFn: async (
      data: CreateEscrowInput & { freelancerAddress: string },
    ) => {
      const response = await axios.post("/api/escrows", data);
      return response.data;
    },
  });
}

export function useUpdateEscrowDb() {
  return useMutation({
    mutationFn: async (data: {
      id: string;
      status: EscrowStatus;
      clientAddress?: string;
    }) => {
      const { id, ...payload } = data;
      const response = await axios.patch(`/api/escrows/${id}`, payload);
      return response.data;
    },
  });
}

export function useDeleteEscrowDb() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`/api/escrows/${id}`);
      return response.data;
    },
    onSuccess: () => {
      // Refresh the dashboard list so the deleted item vanishes
      queryClient.invalidateQueries({ queryKey: ["escrows"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
