import { useMutation } from "@tanstack/react-query";
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
