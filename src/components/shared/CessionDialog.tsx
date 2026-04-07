import { useState, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBuyers, useCreateBuyer, useGenerateCession, useCessionByAnimal, usePreviewCession, type Buyer } from "@/hooks/useCessions";
import { CessionPreviewEditor } from "./CessionPreviewEditor";
import { FileText, Download, UserPlus, Users, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface CessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  animalId: string | null;
  animalType: "bird" | "dog";
  animalLabel: string;
  editMode?: boolean;
  onComplete?: () => void;
}

type Step = "form" | "preview" | "done";

export function CessionDialog({ open, onOpenChange, animalId, animalType, animalLabel, editMode = false, onComplete }: CessionDialogProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>("form");
  const [tab, setTab] = useState<string>("existing");
  const [selectedBuyerId, setSelectedBuyerId] = useState("");
  const [precio, setPrecio] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState("");
  const [resolvedBuyerId, setResolvedBuyerId] = useState("");
  const [pendingNewBuyer, setPendingNewBuyer] = useState<{nombre: string; apellidos: string; dni: string; domicilio: string} | null>(null);

  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [dni, setDni] = useState("");
  const [domicilio, setDomicilio] = useState("");

  const { data: buyers = [], isLoading: loadingBuyers } = useBuyers();
  const createBuyer = useCreateBuyer();
  const generateCession = useGenerateCession();
  const previewCession = usePreviewCession();
  const { data: existingCession } = useCessionByAnimal(animalId, animalType);

  useEffect(() => {
    if (editMode && existingCession && open) {
      setPrecio(String(existingCession.precio));
      setResolvedBuyerId(existingCession.buyer_id);
      const buyer = (existingCession as any).buyers;
      if (buyer) {
        setNombre(buyer.nombre || "");
        setApellidos(buyer.apellidos || "");
        setDni(buyer.dni || "");
        setDomicilio(buyer.domicilio || "");
        setTab("new");
      } else {
        setSelectedBuyerId(existingCession.buyer_id);
        setTab("existing");
      }
    }
  }, [editMode, existingCession, open]);

  const reset = () => {
    setSelectedBuyerId("");
    setPrecio("");
    setPdfUrl(null);
    setPreviewHtml("");
    setPendingNewBuyer(null);
    setNombre("");
    setApellidos("");
    setDni("");
    setDomicilio("");
    setTab("existing");
    setStep("form");
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handlePreview = async () => {
    if (!animalId) return;

    let buyerId = selectedBuyerId;

    if (tab === "new") {
      if (!nombre || !apellidos || !dni || !domicilio) return;
      setPendingNewBuyer({ nombre, apellidos, dni, domicilio });
      try {
        const result = await previewCession.mutateAsync({
          animal_id: animalId,
          animal_type: animalType,
          buyer_id: "pending",
          precio: Number(precio),
          buyer_override: { nombre, apellidos, dni, domicilio },
        });
        setPreviewHtml(result.rendered_html);
        setStep("preview");
      } catch {}
      return;
    }

    if (!buyerId || !precio) return;
    setResolvedBuyerId(buyerId);
    setPendingNewBuyer(null);

    try {
      const result = await previewCession.mutateAsync({
        animal_id: animalId,
        animal_type: animalType,
        buyer_id: buyerId,
        precio: Number(precio),
      });
      setPreviewHtml(result.rendered_html);
      setStep("preview");
    } catch {}
  };

  const handleGeneratePdf = async (finalHtml: string) => {
    if (!animalId) return;

    let buyerId = resolvedBuyerId;

    if (pendingNewBuyer) {
      try {
        const newBuyer = await createBuyer.mutateAsync(pendingNewBuyer);
        buyerId = newBuyer.id;
        setResolvedBuyerId(buyerId);
        setPendingNewBuyer(null);
      } catch {
        return;
      }
    }

    if (!buyerId) return;

    try {
      const result = await generateCession.mutateAsync({
        animal_id: animalId,
        animal_type: animalType,
        buyer_id: buyerId,
        precio: Number(precio),
        rendered_html: finalHtml,
      });
      setPdfUrl(result.pdf_url);
      setStep("done");
      onComplete?.();
    } catch {}
  };

  const getBuyerName = () => {
    if (tab === "new") return `${nombre}_${apellidos}`.replace(/\s+/g, '_');
    const buyer = buyers.find((b: Buyer) => b.id === (resolvedBuyerId || selectedBuyerId));
    return buyer ? `${buyer.nombre}_${buyer.apellidos}`.replace(/\s+/g, '_') : "comprador";
  };

  const [downloading, setDownloading] = useState(false);
  const handleDownload = useCallback(async () => {
    if (!pdfUrl) return;
    setDownloading(true);
    try {
      const res = await fetch(pdfUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cesion_${getBuyerName()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      window.open(pdfUrl, "_blank");
    } finally {
      setDownloading(false);
    }
  }, [pdfUrl, tab, nombre, apellidos, buyers, selectedBuyerId, resolvedBuyerId]);

  const isSubmitting = createBuyer.isPending || previewCession.isPending;
  const canSubmit = tab === "existing"
    ? !!selectedBuyerId && !!precio && Number(precio) > 0
    : !!nombre && !!apellidos && !!dni && !!domicilio && !!precio && Number(precio) > 0;

  const title = editMode ? t("cession.modifyTitle") : t("cession.title");

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={step === "preview" ? "sm:max-w-3xl max-h-[90vh] overflow-y-auto" : "sm:max-w-lg"}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>

        {step === "done" && pdfUrl ? (
          <div className="space-y-4 py-4 text-center">
            <div className="rounded-lg border border-border bg-muted/50 p-6">
              <FileText className="h-12 w-12 mx-auto text-primary mb-3" />
              <p className="font-medium">{t("cession.pdfGenerated")}</p>
              <p className="text-sm text-muted-foreground mt-1">{animalLabel}</p>
            </div>
            <Button className="w-full" onClick={handleDownload} disabled={downloading}>
              {downloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              {t("cession.downloadPdf")}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => handleClose(false)}>
              {t("common.close")}
            </Button>
          </div>
        ) : step === "preview" ? (
          <CessionPreviewEditor
            renderedHtml={previewHtml}
            onBack={() => setStep("form")}
            onGenerate={handleGeneratePdf}
            isGenerating={generateCession.isPending}
          />
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/50 p-3">
              <p className="text-sm font-medium">{t("cession.specimen")}: <span className="text-primary">{animalLabel}</span></p>
            </div>

            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="w-full">
                <TabsTrigger value="existing" className="flex-1 gap-1">
                  <Users className="h-3.5 w-3.5" /> {t("cession.recurringBuyers")}
                </TabsTrigger>
                <TabsTrigger value="new" className="flex-1 gap-1">
                  <UserPlus className="h-3.5 w-3.5" /> {t("cession.newBuyer")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="existing" className="space-y-3 mt-3">
                <div>
                  <Label>{t("cession.recurringBuyer")}</Label>
                  <Select value={selectedBuyerId} onValueChange={setSelectedBuyerId}>
                    <SelectTrigger>
                      <SelectValue placeholder={loadingBuyers ? t("common.loading") : t("cession.selectBuyer")} />
                    </SelectTrigger>
                    <SelectContent>
                      {buyers.filter((b: any) => b.recurrente).map((b: Buyer) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.nombre} {b.apellidos} — {b.dni}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {buyers.filter((b: any) => b.recurrente).length === 0 && !loadingBuyers && (
                    <p className="text-xs text-muted-foreground mt-1">{t("cession.noRecurringBuyers")}</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="new" className="space-y-3 mt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>{t("buyers.name")}</Label>
                    <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Juan" />
                  </div>
                  <div>
                    <Label>{t("buyers.surname")}</Label>
                    <Input value={apellidos} onChange={(e) => setApellidos(e.target.value)} placeholder="García López" />
                  </div>
                </div>
                <div>
                  <Label>{t("buyers.dni")}</Label>
                  <Input value={dni} onChange={(e) => setDni(e.target.value)} placeholder="12345678A" />
                </div>
                <div>
                  <Label>{t("buyers.address")}</Label>
                  <Input value={domicilio} onChange={(e) => setDomicilio(e.target.value)} placeholder="C/ Ejemplo 1, Madrid" />
                </div>
              </TabsContent>
            </Tabs>

            <div>
              <Label>{t("cession.price")}</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => handleClose(false)} disabled={isSubmitting}>
                {t("common.cancel")}
              </Button>
              <Button onClick={handlePreview} disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
                {isSubmitting ? t("common.loading") : t("cession.previewDocument")}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
