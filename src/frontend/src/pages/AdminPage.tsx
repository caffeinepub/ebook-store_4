import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  BookOpen,
  DollarSign,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  Settings,
  Shield,
  Trash2,
  Upload,
} from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { Ebook } from "../backend";
import { ExternalBlob } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAddEbook,
  useDeleteEbook,
  useEbooks,
  useIsStripeConfigured,
  useSetStripeConfig,
  useUpdateEbook,
} from "../hooks/useQueries";

interface EbookFormData {
  title: string;
  description: string;
  priceInCents: string;
  coverFile: File | null;
  pdfFile: File | null;
}

const EMPTY_FORM: EbookFormData = {
  title: "",
  description: "",
  priceInCents: "",
  coverFile: null,
  pdfFile: null,
};

function EbookFormDialog({
  open,
  onClose,
  editingEbook,
}: {
  open: boolean;
  onClose: () => void;
  editingEbook: Ebook | null;
}) {
  const addEbook = useAddEbook();
  const updateEbook = useUpdateEbook();
  const [form, setForm] = useState<EbookFormData>(EMPTY_FORM);
  const [uploadProgress, setUploadProgress] = useState(0);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const isPending = addEbook.isPending || updateEbook.isPending;

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.description.trim() || !form.priceInCents) {
      toast.error("Please fill in all fields.");
      return;
    }
    const price = Number.parseFloat(form.priceInCents);
    if (Number.isNaN(price) || price <= 0) {
      toast.error("Please enter a valid price.");
      return;
    }

    try {
      let coverBlob: ExternalBlob;
      let pdfBlob: ExternalBlob;

      if (editingEbook) {
        coverBlob = form.coverFile
          ? ExternalBlob.fromBytes(
              new Uint8Array(await form.coverFile.arrayBuffer()),
            ).withUploadProgress((p) => setUploadProgress(p * 0.5))
          : editingEbook.coverImageBlob;
        pdfBlob = form.pdfFile
          ? ExternalBlob.fromBytes(
              new Uint8Array(await form.pdfFile.arrayBuffer()),
            ).withUploadProgress((p) => setUploadProgress(50 + p * 0.5))
          : editingEbook.pdfBlob;

        await updateEbook.mutateAsync({
          ...editingEbook,
          title: form.title,
          description: form.description,
          priceInCents: BigInt(Math.round(price * 100)),
          coverImageBlob: coverBlob,
          pdfBlob,
        });
        toast.success("Ebook updated successfully!");
      } else {
        if (!form.coverFile || !form.pdfFile) {
          toast.error("Please upload both a cover image and a PDF.");
          return;
        }
        coverBlob = ExternalBlob.fromBytes(
          new Uint8Array(await form.coverFile.arrayBuffer()),
        ).withUploadProgress((p) => setUploadProgress(p * 0.5));
        pdfBlob = ExternalBlob.fromBytes(
          new Uint8Array(await form.pdfFile.arrayBuffer()),
        ).withUploadProgress((p) => setUploadProgress(50 + p * 0.5));

        await addEbook.mutateAsync({
          id: crypto.randomUUID(),
          title: form.title,
          description: form.description,
          priceInCents: BigInt(Math.round(price * 100)),
          coverImageBlob: coverBlob,
          pdfBlob,
        });
        toast.success("Ebook added successfully!");
      }
      setForm(EMPTY_FORM);
      setUploadProgress(0);
      onClose();
    } catch {
      toast.error("Failed to save ebook. Please try again.");
    }
  };

  const handleOpen = () => {
    if (editingEbook) {
      setForm({
        title: editingEbook.title,
        description: editingEbook.description,
        priceInCents: (Number(editingEbook.priceInCents) / 100).toFixed(2),
        coverFile: null,
        pdfFile: null,
      });
    } else {
      setForm(EMPTY_FORM);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
        else handleOpen();
      }}
    >
      <DialogContent data-ocid="admin.dialog" className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {editingEbook ? "Edit Ebook" : "Add New Ebook"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              data-ocid="admin.input"
              placeholder="Enter ebook title"
              value={form.title}
              onChange={(e) =>
                setForm((p) => ({ ...p, title: e.target.value }))
              }
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              data-ocid="admin.textarea"
              placeholder="Write a compelling description…"
              rows={4}
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="price">Price (USD)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="price"
                data-ocid="admin.input"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="4.99"
                className="pl-8"
                value={form.priceInCents}
                onChange={(e) =>
                  setForm((p) => ({ ...p, priceInCents: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Cover Image</Label>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    coverFile: e.target.files?.[0] ?? null,
                  }))
                }
              />
              <Button
                type="button"
                data-ocid="admin.upload_button"
                variant="outline"
                onClick={() => coverInputRef.current?.click()}
                className="gap-2 w-full"
              >
                <Upload className="w-4 h-4" />
                {form.coverFile
                  ? `${form.coverFile.name.slice(0, 14)}…`
                  : editingEbook
                    ? "Replace Cover"
                    : "Upload Cover"}
              </Button>
            </div>
            <div className="grid gap-1.5">
              <Label>PDF File</Label>
              <input
                ref={pdfInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    pdfFile: e.target.files?.[0] ?? null,
                  }))
                }
              />
              <Button
                type="button"
                data-ocid="admin.upload_button"
                variant="outline"
                onClick={() => pdfInputRef.current?.click()}
                className="gap-2 w-full"
              >
                <Upload className="w-4 h-4" />
                {form.pdfFile
                  ? `${form.pdfFile.name.slice(0, 14)}…`
                  : editingEbook
                    ? "Replace PDF"
                    : "Upload PDF"}
              </Button>
            </div>
          </div>
          {isPending && uploadProgress > 0 && (
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="h-2 bg-primary transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            data-ocid="admin.cancel_button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            data-ocid="admin.save_button"
            onClick={handleSubmit}
            disabled={isPending}
            className="bg-primary text-primary-foreground gap-2"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {isPending
              ? "Saving…"
              : editingEbook
                ? "Save Changes"
                : "Add Ebook"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StripeConfigPanel() {
  const { data: isConfigured } = useIsStripeConfigured();
  const setConfig = useSetStripeConfig();
  const [secretKey, setSecretKey] = useState("");
  const [showKey, setShowKey] = useState(false);

  const handleSave = async () => {
    if (!secretKey.startsWith("sk_")) {
      toast.error("Please enter a valid Stripe secret key (starts with sk_).");
      return;
    }
    try {
      await setConfig.mutateAsync({
        secretKey,
        allowedCountries: [],
      });
      toast.success("Stripe configuration saved!");
      setSecretKey("");
    } catch {
      toast.error("Failed to save Stripe configuration.");
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Settings className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-foreground">
            Stripe Configuration
          </h3>
          <p className="text-sm text-muted-foreground">
            {isConfigured ? (
              <span className="text-green-600">
                ✓ Stripe is configured and active
              </span>
            ) : (
              "Set up Stripe to accept payments"
            )}
          </p>
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="stripe-key">Secret Key</Label>
        <div className="relative">
          <Input
            id="stripe-key"
            data-ocid="admin.input"
            type={showKey ? "text" : "password"}
            placeholder="sk_live_… or sk_test_…"
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowKey((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showKey ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
      <Button
        data-ocid="admin.save_button"
        onClick={handleSave}
        disabled={setConfig.isPending || !secretKey}
        className="bg-primary text-primary-foreground gap-2"
      >
        {setConfig.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
        {setConfig.isPending ? "Saving…" : "Save Configuration"}
      </Button>
    </div>
  );
}

export default function AdminPage() {
  const { login, loginStatus, identity } = useInternetIdentity();
  const { data: ebooks, isLoading } = useEbooks();
  const deleteEbook = useDeleteEbook();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEbook, setEditingEbook] = useState<Ebook | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Ebook | null>(null);

  const handleEdit = (ebook: Ebook) => {
    setEditingEbook(ebook);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteEbook.mutateAsync(deleteTarget.id);
      toast.success("Ebook deleted.");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete ebook.");
    }
  };

  if (!identity) {
    return (
      <main className="relative z-10 min-h-[70vh] flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-6 text-center max-w-sm"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-3xl font-bold text-foreground">
              Admin Panel
            </h2>
            <p className="font-serif text-muted-foreground mt-2">
              Sign in with Internet Identity to manage your ebook store.
            </p>
          </div>
          <Button
            data-ocid="admin.primary_button"
            onClick={login}
            disabled={loginStatus === "logging-in"}
            className="bg-primary text-primary-foreground gap-2 px-8"
          >
            {loginStatus === "logging-in" && (
              <Loader2 className="w-4 h-4 animate-spin" />
            )}
            {loginStatus === "logging-in" ? "Signing in…" : "Sign In"}
          </Button>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="relative z-10 container mx-auto px-6 py-10">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Admin Panel
            </h1>
            <p className="font-serif text-muted-foreground mt-1">
              Manage your ebook store
            </p>
          </div>
          <Button
            data-ocid="admin.open_modal_button"
            onClick={() => {
              setEditingEbook(null);
              setDialogOpen(true);
            }}
            className="bg-primary text-primary-foreground gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Ebook
          </Button>
        </div>

        <Tabs defaultValue="ebooks" data-ocid="admin.tab">
          <TabsList className="mb-6">
            <TabsTrigger data-ocid="admin.tab" value="ebooks">
              Ebooks
            </TabsTrigger>
            <TabsTrigger data-ocid="admin.tab" value="settings">
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ebooks">
            {isLoading ? (
              <div
                data-ocid="admin.loading_state"
                className="flex items-center justify-center py-16"
              >
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : !ebooks || ebooks.length === 0 ? (
              <div
                data-ocid="admin.empty_state"
                className="flex flex-col items-center justify-center py-20 gap-4 text-center border-2 border-dashed border-border rounded-2xl"
              >
                <BookOpen className="w-12 h-12 text-muted-foreground/40" />
                <h3 className="font-display text-lg text-muted-foreground">
                  No ebooks yet
                </h3>
                <p className="font-serif text-sm text-muted-foreground/70">
                  Add your first ebook to start selling.
                </p>
                <Button
                  data-ocid="admin.primary_button"
                  onClick={() => {
                    setEditingEbook(null);
                    setDialogOpen(true);
                  }}
                  variant="outline"
                  className="gap-2 mt-2"
                >
                  <Plus className="w-4 h-4" />
                  Add First Ebook
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {ebooks.map((ebook, index) => (
                  <motion.div
                    key={ebook.id}
                    data-ocid={`admin.item.${index + 1}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-4 bg-card border border-border rounded-2xl p-4 hover:shadow-xs transition-shadow"
                  >
                    <div className="w-16 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
                      {ebook.coverImageBlob?.getDirectURL?.() ? (
                        <img
                          src={ebook.coverImageBlob.getDirectURL()}
                          alt={ebook.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-semibold text-foreground truncate">
                        {ebook.title}
                      </h3>
                      <p className="font-serif text-sm text-muted-foreground line-clamp-1 mt-0.5">
                        {ebook.description}
                      </p>
                      <Badge variant="outline" className="mt-2 text-xs">
                        ${(Number(ebook.priceInCents) / 100).toFixed(2)}
                      </Badge>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <Button
                        data-ocid={`admin.item.${index + 1}.edit_button`}
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(ebook)}
                        className="rounded-xl"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        data-ocid={`admin.item.${index + 1}.delete_button`}
                        variant="outline"
                        size="icon"
                        onClick={() => setDeleteTarget(ebook)}
                        className="rounded-xl text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings">
            <StripeConfigPanel />
          </TabsContent>
        </Tabs>
      </motion.div>

      <EbookFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        editingEbook={editingEbook}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent data-ocid="admin.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              Delete Ebook?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-serif">
              Are you sure you want to delete &quot;{deleteTarget?.title}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="admin.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="admin.confirm_button"
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              {deleteEbook.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
