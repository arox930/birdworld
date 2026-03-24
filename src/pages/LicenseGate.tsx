import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { KeyRound, Loader2, AlertCircle } from "lucide-react";
import { useLicense } from "@/hooks/useLicense";

export default function LicenseGate() {
  const [key, setKey] = useState("");
  const { validate, isValidating, validationError } = useLicense();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;
    try {
      await validate(key.trim());
    } catch {
      // error handled via validationError
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <KeyRound className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Licencia requerida</CardTitle>
          <CardDescription>
            Introduce tu clave de licencia para acceder a la aplicación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Introduce tu licencia..."
              value={key}
              onChange={(e) => setKey(e.target.value)}
              disabled={isValidating}
              autoFocus
            />
            {validationError && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{validationError.message}</span>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isValidating || !key.trim()}>
              {isValidating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validando...
                </>
              ) : (
                "Activar licencia"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
