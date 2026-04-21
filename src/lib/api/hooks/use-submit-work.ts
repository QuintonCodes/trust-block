import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

type SubmitWorkParams = {
  escrowId: string;
  milestoneId: string;
  submissionType: "LINK" | "FILE";
  submissionUrl: string;
};

export function useSubmitWorkMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SubmitWorkParams) => {
      const response = await axios.patch(
        `/api/escrows/${data.escrowId}/milestones/${data.milestoneId}/submit`,
        {
          submissionType: data.submissionType,
          submissionUrl: data.submissionUrl,
        },
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate the specific escrow query so the UI updates with the new link/file immediately
      queryClient.invalidateQueries({
        queryKey: ["escrow", variables.escrowId],
      });
    },
  });
}
