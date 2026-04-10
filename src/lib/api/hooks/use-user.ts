import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

import { User, UserRole } from "@/lib/types";

export function useGetUser(address?: string) {
  return useQuery({
    queryKey: ["user", address?.toLowerCase()],
    queryFn: async () => {
      if (!address) return null;
      const response = await axios.get<{ user: User | null }>(
        `/api/users/${address.toLowerCase()}`,
      );
      return response.data.user;
    },
    enabled: !!address,
  });
}

export interface UpdateUserPayload {
  displayName?: string | null;
  bio?: string | null;
  role?: UserRole;
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      address,
      data,
    }: {
      address: string;
      data: UpdateUserPayload;
    }) => {
      const response = await axios.patch(
        `/api/users/${address.toLowerCase()}`,
        data,
      );
      return response.data.user;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["user", variables.address.toLowerCase()],
      });
    },
  });
}
