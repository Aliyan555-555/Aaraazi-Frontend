# Frontend Cleanup and Developer Module Removal Plan

## 1. Objective

Completely remove the "Developer Module" and all associated artifacts, clean up unused code, and remove demo data/local storage dependencies to prepare the application for production-grade usage with the real backend.

## 2. Components to Delete

The following components are identified as part of the Developer/Construction logic and will be deleted:

- `src/components/DevelopersDashboard.tsx`
- `src/components/ProjectAccounting.tsx`
- `src/components/ConstructionTracking.tsx`
- `src/components/LandAcquisitionDashboard.tsx`
- `src/components/LandParcelForm.tsx`
- `src/components/ProcurementDashboard.tsx`
- `src/components/AdvancedSupplierManagement.tsx`
- `src/components/SupplierPortalDashboard.tsx`
- `src/components/BudgetingDashboard.tsx`
- `src/components/FeasibilityCalculator.tsx`
- `src/components/ConstructionAreaForm.tsx`
- `src/components/UnitForm.tsx`
- `src/components/ProjectForm.tsx`
- `src/components/ProjectList.tsx` (Unless used by Agency for listing projects - will verify)
- `src/components/PurchaseOrderModal.tsx`
- `src/components/RFQCreationForm.tsx`
- `src/components/RFQComparativeAnalysis.tsx`
- `src/components/SmartProcurementCostControl.tsx`
- `src/components/SupplierProfile.tsx`
- `src/components/GoodsReceiptNoteForm.tsx`
- `src/components/ProjectDetailEnhancedFixed.tsx`
- `src/lib/projects.ts`
- `src/lib/landAcquisition.ts`
- `src/lib/data.ts` (Check if this is legacy demo data)

## 3. Code Modifications

### A. Routing & Navigation

- **`src/components/Sidebar.tsx`**: Remove the entire "Developers" section and any logic checking for `user.modules.includes('developer')`.
- **`src/components/Navbar.tsx`**: Remove the "Switch Module" button and logic.
- **`src/components/ModuleSelector.tsx`**: Remove this component. The app should default to the Agency Dashboard.
- **`src/components/SaaSLogin.tsx`**: Simplify login flow if it directs to Module Selector.

### B. Types & State (`src/types/` and `src/lib/`)

- **`src/types/saas.ts`**: Remove `DEVELOPER` from `Module` enum/types. Remove `SaaSUserRole` values related to developers (e.g. `developer-admin`).
- **`src/lib/saas.ts`**:
  - Remove `mockDevelopers` data.
  - Remove `initializeDemoTenants` and logic that seeds `localStorage`.
  - Function `hasModuleAccess` can be simplified or removed if we assume Agency only.
- **`src/lib/tenantService.ts`**: Remove Developer specific checks.

### C. Dashboard

- **`src/components/SuperAdminDashboard.tsx`**: Remove "Developer" counts/stats cards.
- **`src/components/SaaSAdminDashboard.tsx`**: Remove Developer tenant management if present.

## 4. Cleanup Unused Components & Test Files

- Delete `src/components/test/` directory.
- Delete `src/components/DevTools.tsx`.
- Delete `src/components/MigrationChecker.tsx` and `MigrationDashboard.tsx` if they are no longer needed for the upgrade.

## 5. Local Storage & Demo Data Cleanup

- Modify `src/lib/saas.ts` to stop initializing `localStorage` with fake data on load.
- Create a specific "cleanup" script or manually clear `localStorage` logic in `SaaSLogin.tsx` to force a fresh state.

## 6. Execution Steps

1.  **Delete Files**: Execute deletion of listed components.
2.  **Clean Sidebar**: Remove developer menu items.
3.  **Clean Navbar**: Remove module switcher.
4.  **Clean Types**: Update `saas.ts` types.
5.  **Clean Mock Data**: Strip `saas.ts` of developer data and explicitly strictly type the User to `Agency` roles only.
6.  **Fix Routes**: Redirect root/login straight to Agency Dashboard.
