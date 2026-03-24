import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

function getDeviceHash(): string {
  const key = "app_device_hash";
  let hash = localStorage.getItem(key);
  if (!hash) {
    hash = crypto.randomUUID();
    localStorage.setItem(key, hash);
  }
  return hash;
}

export function useLicense() {
  const queryClient = useQueryClient();

  const { data: isLicensed, isLoading } = useQuery({
    queryKey: ["app-license"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_licenses" as any)
        .select("id")
        .limit(1);
      if (error) throw error;
      return (data as any[]).length > 0;
    },
    staleTime: Infinity,
  });

  const validateMutation = useMutation({
    mutationFn: async (licenseKey: string) => {
      const deviceHash = getDeviceHash();
      const { data, error } = await supabase.functions.invoke("validate-license", {
        body: { license_key: licenseKey, device_hash: deviceHash },
      });
      if (error) throw error;
      if (!data.valid) {
        throw new Error(data.error || "Licencia no válida");
      }
      return data;
    },
    onSuccess: () => {
      queryClient.setQueryData(["app-license"], true);
    },
  });

  return {
    isLicensed: !!isLicensed,
    isLoading,
    validate: validateMutation.mutateAsync,
    isValidating: validateMutation.isPending,
    validationError: validateMutation.error,
  };
}
