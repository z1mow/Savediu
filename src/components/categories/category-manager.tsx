"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Loader2, Pencil, Plus, Tags, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import type { Category, TransactionType } from "@/lib/types";
import { cn } from "@/lib/utils";

// Tema ile uyumlu pastel kategori paleti
export const CATEGORY_COLORS = [
  "#8FAF9A", "#7893AD", "#B07D7D", "#B3A179",
  "#977FA8", "#6F9A96", "#C98A6B", "#7FA36F",
  "#A38BC0", "#D4A3A3", "#5F8371", "#8A8F98",
];

function ColorSwatches({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {CATEGORY_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          aria-label={`Renk ${color}`}
          onClick={() => onChange(color)}
          className={cn(
            "flex size-6.5 items-center justify-center rounded-full transition-transform hover:scale-110",
            value === color && "ring-2 ring-ring ring-offset-2 ring-offset-background"
          )}
          style={{ background: color }}
        >
          {value === color && <Check className="size-3.5 text-white" />}
        </button>
      ))}
    </div>
  );
}

function CategoryRow({
  category,
  onChanged,
}: {
  category: Category;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState(category.name);
  const [color, setColor] = useState(category.color ?? CATEGORY_COLORS[0]);

  async function save() {
    if (!name.trim()) {
      toast.error("Kategori adı boş olamaz");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("categories")
      .update({ name: name.trim(), color })
      .eq("id", category.id);
    setBusy(false);

    if (error) {
      toast.error(
        error.code === "23505" ? "Bu isimde bir kategori zaten var" : "Kategori güncellenemedi"
      );
      return;
    }
    setEditing(false);
    toast.success("Kategori güncellendi");
    onChanged();
  }

  async function remove() {
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.from("categories").delete().eq("id", category.id);
    setBusy(false);

    if (error) {
      toast.error("Kategori silinemedi");
      return;
    }
    toast.success("Kategori silindi — işlemleri 'Kategorisiz' olarak kaldı");
    onChanged();
  }

  if (editing) {
    return (
      <li className="space-y-2.5 rounded-2xl bg-muted/50 p-3">
        <div className="flex items-center gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-9 flex-1 rounded-lg"
            autoFocus
          />
          <Button
            size="icon"
            disabled={busy}
            onClick={save}
            className="size-9 rounded-lg"
            aria-label="Kaydet"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setEditing(false)}
            className="size-9 rounded-lg"
            aria-label="Vazgeç"
          >
            <X className="size-4" />
          </Button>
        </div>
        <ColorSwatches value={color} onChange={setColor} />
      </li>
    );
  }

  return (
    <li className="group flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-muted/50">
      <span
        className="size-3 rounded-full"
        style={{ background: category.color ?? "var(--muted-foreground)" }}
      />
      <span className="flex-1 truncate text-sm font-medium">{category.name}</span>
      <Button
        size="icon"
        variant="ghost"
        aria-label="Düzenle"
        onClick={() => setEditing(true)}
        className="size-8 rounded-lg text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
      >
        <Pencil className="size-3.5" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        aria-label="Sil"
        disabled={busy}
        onClick={remove}
        className="size-8 rounded-lg text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
      >
        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
      </Button>
    </li>
  );
}

function AddCategoryForm({
  type,
  onChanged,
}: {
  type: TransactionType;
  onChanged: () => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(CATEGORY_COLORS[0]);
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!name.trim()) {
      toast.error("Kategori adı girin");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("categories").insert({
      user_id: user!.id,
      name: name.trim(),
      type,
      color,
    });
    setBusy(false);

    if (error) {
      toast.error(
        error.code === "23505" ? "Bu isimde bir kategori zaten var" : "Kategori eklenemedi"
      );
      return;
    }
    setName("");
    toast.success("Kategori eklendi 🏷️");
    onChanged();
  }

  return (
    <div className="space-y-2.5 rounded-2xl border border-dashed border-border p-3">
      <div className="flex items-center gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder={type === "expense" ? "örn. Evcil Hayvan" : "örn. Kira Geliri"}
          className="h-9 flex-1 rounded-lg"
        />
        <Button
          size="icon"
          disabled={busy}
          onClick={add}
          className="size-9 rounded-lg"
          aria-label="Kategori ekle"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
        </Button>
      </div>
      <ColorSwatches value={color} onChange={setColor} />
    </div>
  );
}

export function CategoryManager({
  categories,
  defaultType = "expense",
}: {
  categories: Category[];
  defaultType?: TransactionType;
}) {
  const router = useRouter();
  const [type, setType] = useState<TransactionType>(defaultType);

  const filtered = categories
    .filter((c) => c.type === type)
    .sort((a, b) => a.name.localeCompare(b.name, "tr"));

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="outline" className="rounded-full">
            <Tags className="size-4" /> Kategoriler
          </Button>
        }
      />
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Kategoriler</DialogTitle>
          <DialogDescription>
            Kendi kategorilerinizi ekleyin, yeniden adlandırın veya renklendirin.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={type} onValueChange={(v) => setType(v as TransactionType)}>
          <TabsList className="w-full rounded-full">
            <TabsTrigger value="expense" className="flex-1 rounded-full">
              Gider
            </TabsTrigger>
            <TabsTrigger value="income" className="flex-1 rounded-full">
              Gelir
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <AddCategoryForm type={type} onChanged={() => router.refresh()} />

        <ul className="-mx-1 max-h-72 space-y-0.5 overflow-y-auto px-1">
          {filtered.map((c) => (
            <CategoryRow key={c.id} category={c} onChanged={() => router.refresh()} />
          ))}
          {filtered.length === 0 && (
            <li className="py-8 text-center text-sm text-muted-foreground">
              Bu türde kategori yok — yukarıdan ekleyin.
            </li>
          )}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
