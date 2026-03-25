import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

async function getDeviceHash(): Promise<string> {
  const nav = navigator as any;
  const parts = [
    nav.userAgent || "",
    nav.platform || "",
    nav.language || "",
    `${screen.width}x${screen.height}x${screen.colorDepth}`,
    `cores:${nav.hardwareConcurrency || "?"}`,
    `mem:${nav.deviceMemory || "?"}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone || "",
  ];
  const raw = parts.join("|");
  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
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
