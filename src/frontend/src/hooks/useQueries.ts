import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Ebook, ShoppingItem, StripeConfiguration } from "../backend";
import { ExternalBlob } from "../backend";
import { useActor } from "./useActor";

export function useEbooks() {
  const { actor, isFetching } = useActor();
  return useQuery<Ebook[]>({
    queryKey: ["ebooks"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getEbooks();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsStripeConfigured() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isStripeConfigured"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isStripeConfigured();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useStripeSessionStatus(sessionId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["stripeSession", sessionId],
    queryFn: async () => {
      if (!actor || !sessionId) return null;
      return actor.getStripeSessionStatus(sessionId);
    },
    enabled: !!actor && !isFetching && !!sessionId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 2000;
      if (data.__kind__ === "completed" || data.__kind__ === "failed")
        return false;
      return 2000;
    },
  });
}

export function useCreateCheckoutSession() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      items,
      successUrl,
      cancelUrl,
    }: {
      items: ShoppingItem[];
      successUrl: string;
      cancelUrl: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createCheckoutSession(items, successUrl, cancelUrl);
    },
  });
}

export function useAddEbook() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ebook: Ebook) => {
      if (!actor) throw new Error("Not connected");
      return actor.addEbook(ebook);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ebooks"] });
    },
  });
}

export function useUpdateEbook() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ebook: Ebook) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateEbook(ebook);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ebooks"] });
    },
  });
}

export function useDeleteEbook() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteEbook(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ebooks"] });
    },
  });
}

export function useSetStripeConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (config: StripeConfiguration) => {
      if (!actor) throw new Error("Not connected");
      return actor.setStripeConfiguration(config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["isStripeConfigured"] });
    },
  });
}

export function useGetEbookDownloadUrl() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      sessionId,
      ebookId,
    }: { sessionId: string; ebookId: string }) => {
      if (!actor) throw new Error("Not connected");
      const blob = await actor.getEbookDownloadUrl(sessionId, ebookId);
      return blob.getDirectURL();
    },
  });
}

export function useCompletePurchase() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      sessionId,
      buyerId,
      ebookId,
    }: {
      sessionId: string;
      buyerId: string;
      ebookId: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.completePurchase(sessionId, buyerId, ebookId);
    },
  });
}

export { ExternalBlob };
