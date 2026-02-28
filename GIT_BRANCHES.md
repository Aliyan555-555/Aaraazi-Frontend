# Git branches: aaraazi/properties & aaraazi/documents

Run these from the **repository root** (parent of `aaraazi-frontend`), e.g. `d:\Aaraazi\Aaraazi`.

---

## 1. Branch `aaraazi/properties` – properties-related files (under aaraazi-frontend)

Create the branch, add only properties-related files under **aaraazi-frontend**, commit and push.

```powershell
; cd "d:\Aaraazi\Aaraazi"; git checkout -b aaraazi/properties
```

Then add these paths (all under `aaraazi-frontend/`):

```powershell
; cd "d:\Aaraazi\Aaraazi"; git add aaraazi-frontend/src/lib/api/properties.ts
; cd "d:\Aaraazi\Aaraazi"; git add aaraazi-frontend/src/lib/api/locations.ts
; cd "d:\Aaraazi\Aaraazi"; git add aaraazi-frontend/src/lib/api/client.ts
; cd "d:\Aaraazi\Aaraazi"; git add aaraazi-frontend/src/components/properties/ImageUpload.tsx
; cd "d:\Aaraazi\Aaraazi"; git add aaraazi-frontend/src/components/properties/PropertiesWorkspace.tsx
; cd "d:\Aaraazi\Aaraazi"; git add aaraazi-frontend/src/components/properties/PropertyWorkspaceCard.tsx
; cd "d:\Aaraazi\Aaraazi"; git add aaraazi-frontend/src/components/PropertyForm.tsx
; cd "d:\Aaraazi\Aaraazi"; git add aaraazi-frontend/src/components/PropertyAddressFields.tsx
; cd "d:\Aaraazi\Aaraazi"; git add aaraazi-frontend/app/dashboard/properties/page.tsx
; cd "d:\Aaraazi\Aaraazi"; git add aaraazi-frontend/app/dashboard/properties/new/page.tsx
; cd "d:\Aaraazi\Aaraazi"; git add "aaraazi-frontend/app/dashboard/properties/[id]/page.tsx"
; cd "d:\Aaraazi\Aaraazi"; git add "aaraazi-frontend/app/dashboard/properties/[id]/edit/page.tsx"
; cd "d:\Aaraazi\Aaraazi"; git add aaraazi-frontend/src/types/properties.ts
```

Or add in one go:

```powershell
; cd "d:\Aaraazi\Aaraazi"; git add aaraazi-frontend/src/lib/api/properties.ts aaraazi-frontend/src/lib/api/locations.ts aaraazi-frontend/src/lib/api/client.ts aaraazi-frontend/src/components/properties/ImageUpload.tsx aaraazi-frontend/src/components/properties/PropertiesWorkspace.tsx aaraazi-frontend/src/components/properties/PropertyWorkspaceCard.tsx aaraazi-frontend/src/components/PropertyForm.tsx aaraazi-frontend/src/components/PropertyAddressFields.tsx aaraazi-frontend/app/dashboard/properties/page.tsx aaraazi-frontend/app/dashboard/properties/new/page.tsx "aaraazi-frontend/app/dashboard/properties/[id]/page.tsx" "aaraazi-frontend/app/dashboard/properties/[id]/edit/page.tsx" aaraazi-frontend/src/types/properties.ts
```

Commit and push:

```powershell
; cd "d:\Aaraazi\Aaraazi"; git commit -m "feat(properties): properties module under aaraazi-frontend"
; cd "d:\Aaraazi\Aaraazi"; git push -u origin aaraazi/properties
```

---

## 2. Branch `aaraazi/documents` – other files

Switch to the documents branch and push the rest of your changes there.

```powershell
; cd "d:\Aaraazi\Aaraazi"; git checkout aaraazi/documents
; cd "d:\Aaraazi\Aaraazi"; git add .
; cd "d:\Aaraazi\Aaraazi"; git status
; cd "d:\Aaraazi\Aaraazi"; git commit -m "chore: documents and other updates"
; cd "d:\Aaraazi\Aaraazi"; git push origin aaraazi/documents
```

If `aaraazi/documents` does not exist yet:

```powershell
; cd "d:\Aaraazi\Aaraazi"; git checkout -b aaraazi/documents
; cd "d:\Aaraazi\Aaraazi"; git add .
; cd "d:\Aaraazi\Aaraazi"; git commit -m "chore: documents branch"
; cd "d:\Aaraazi\Aaraazi"; git push -u origin aaraazi/documents
```

---

## If your repo root is `aaraazi-frontend`

If the git repo is **inside** `aaraazi-frontend` (so you run git from `d:\Aaraazi\Aaraazi\aaraazi-frontend`), use:

```powershell
; cd "d:\Aaraazi\Aaraazi\aaraazi-frontend"; git checkout -b aaraazi/properties
; cd "d:\Aaraazi\Aaraazi\aaraazi-frontend"; git add src/lib/api/properties.ts src/lib/api/locations.ts src/lib/api/client.ts src/components/properties/ src/components/PropertyForm.tsx src/components/PropertyAddressFields.tsx app/dashboard/properties/ src/types/properties.ts
; cd "d:\Aaraazi\Aaraazi\aaraazi-frontend"; git commit -m "feat(properties): properties module"
; cd "d:\Aaraazi\Aaraazi\aaraazi-frontend"; git push -u origin aaraazi/properties
```

Then for documents:

```powershell
; cd "d:\Aaraazi\Aaraazi\aaraazi-frontend"; git checkout -b aaraazi/documents
; cd "d:\Aaraazi\Aaraazi\aaraazi-frontend"; git add .
; cd "d:\Aaraazi\Aaraazi\aaraazi-frontend"; git commit -m "chore: documents and other updates"
; cd "d:\Aaraazi\Aaraazi\aaraazi-frontend"; git push -u origin aaraazi/documents
```
