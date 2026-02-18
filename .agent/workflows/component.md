---
description: UI komponenti oluşturma/ekleme istekleri için kurallar
---

# Component Ekleme Workflow

Bu workflow "tab yap", "buton ekle", "component oluştur" gibi isteklerde kullanılır.

## Önce Kontrol Et

1. `.agent/component-rules.md` dosyasını oku
2. İstenen component zaten tanımlı mı kontrol et
3. Tanımlıysa o component'i kullan, değilse yeni oluştur

---

## Mevcut Custom Componentler

### XTabs - Tab Komponenti
**Dosya:** `src/components/ui/x-tabs.tsx`
**Kullanım durumu:** Tab, sekme, format seçici istekleri

```tsx
import { XTabs } from "@/components/ui/x-tabs";

<XTabs
  value={selectedValue}
  onValueChange={setSelectedValue}
  options={[
    { id: "opt1", label: "Seçenek 1" },
    { id: "opt2", label: "Seçenek 2" },
  ]}
/>
```

---

### XButtonGroup - Buton Grubu Komponenti
**Dosya:** `src/components/ui/x-button-group.tsx`
**Kullanım durumu:** Buton seçici, grid butonlar, çoklu seçenek grupları

```tsx
import { XButtonGroup } from "@/components/ui/x-button-group";

<XButtonGroup
  value={selectedValue}
  onValueChange={setSelectedValue}
  options={[
    { id: "opt1", label: "Seçenek 1" },
    { id: "opt2", label: "Seçenek 2" },
  ]}
  columns={2}  // 2, 3, veya 4
/>
```

---

### ConfirmDialog - Onay Modalı Komponenti
**Dosya:** `src/components/ui/confirm-dialog.tsx`
**Kullanım durumu:** Silme onayı, tehlikeli işlem onayı, "Emin misiniz?" soruları. Tüm onay dialog ihtiyaçlarında bu component kullanılmalıdır.

```tsx
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const [confirmOpen, setConfirmOpen] = useState(false);

<ConfirmDialog
  open={confirmOpen}
  onOpenChange={setConfirmOpen}
  title="İşlemi Sil"
  description="Bu işlemi silmek istediğinize emin misiniz?"
  confirmLabel="Sil"
  cancelLabel="Vazgeç"
  variant="destructive"  // veya "default"
  onConfirm={() => { /* silme işlemi */ }}
/>
```

> **KURAL:** Yeni bir onay/soru modalı gerektiğinde her zaman bu component kullanılır.
> Yeni AlertDialog/Dialog oluşturulmaz.

---

## Yeni Component Oluştururken

1. `src/components/ui/` altında oluştur
2. `x-` prefix kullan (örn: `x-tabs.tsx`, `x-button.tsx`)
3. Dark mode uyumlu yap
4. Bu workflow dosyasına ekle
