
import React, { useMemo, useCallback } from "react";
import {
  Plus,
  Trash2,
  Download,
  Home as HomeIcon,
} from "lucide-react";
import { User, RentCycle } from "../../types";
import { WorkspacePageTemplate } from "@/components/workspace/WorkspacePageTemplate";
import { RentCycleWorkspaceCard } from "./RentCycleWorkspaceCard";
import { StatusBadge } from "../layout/StatusBadge";
import { EmptyStatePresets } from "@/components/workspace/index";
import type { Column } from "@/components/workspace/index";
import { formatPKR } from "../../lib/currency";
import { toast } from "sonner";
import { logger } from "../../lib/logger";
import { useRentCycles } from "@/hooks/useRentCycles";
import type { RentCycleApiResponse } from "@/lib/api/rent-cycles";

export interface RentCyclesWorkspaceProps {
  user: User;
  onNavigate: (section: string, id?: string) => void;
  onStartNew?: () => void;
  onEditCycle?: (cycle: RentCycleApiResponse) => void;
}

/**
 * RentCyclesWorkspace - Complete workspace using template system
 */
export const RentCyclesWorkspace: React.FC<
  RentCyclesWorkspaceProps
> = ({ user, onNavigate, onStartNew, onEditCycle }) => {
  // ── Real API data ──────────────────────────────────────────
  const { cycles: allCycles, isLoading } = useRentCycles();

  // Calculate stats from API response data
  const stats = useMemo(() => {
    const available = allCycles.filter(
      (c) => c.status === "AVAILABLE" || c.status === "LISTED",
    ).length;
    const active = allCycles.filter(
      (c) => c.status === "ACTIVE" || c.status === "LEASED",
    ).length;

    // monthlyRent is serialised as a Decimal string by Prisma
    const monthlyRevenue = allCycles
      .filter((c) => c.status === "ACTIVE")
      .reduce((sum, c) => sum + parseFloat(c.monthlyRent || "0"), 0);

    return [
      { label: "Total", value: allCycles.length, variant: "default" as const },
      { label: "Available", value: available, variant: "success" as const },
      { label: "Active Leases", value: active, variant: "info" as const },
      {
        label: "Monthly Revenue",
        value: formatPKR(monthlyRevenue).replace("PKR ", ""),
        variant: "default" as const,
      },
    ];
  }, [allCycles]);

  // Define table columns using RentCycleApiResponse shape
  const columns: Column<RentCycleApiResponse>[] = [
    {
      id: "property",
      label: "Property",
      accessor: (c) => {
        const address = c.propertyListing?.masterProperty?.address;
        const cityName = address?.city?.name ?? "";
        const areaName = address?.area?.name ?? "";
        const propertyLabel = [areaName, cityName].filter(Boolean).join(", ") || c.propertyListing?.title || "Property";
        const propertyType = c.propertyListing?.masterProperty?.type ?? "";
        return (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
              <HomeIcon className="h-6 w-6 text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate">
                {propertyLabel}
              </div>
              <div className="text-sm text-gray-500 capitalize">
                {propertyType || "Property"}
              </div>
            </div>
          </div>
        );
      },
      width: "300px",
      sortable: true,
    },
    {
      id: "monthlyRent",
      label: "Monthly Rent",
      accessor: (c) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">
            {formatPKR(parseFloat(c.monthlyRent))}
          </div>
          <div className="text-xs text-gray-500">
            Deposit: {c.securityDeposit ? formatPKR(parseFloat(c.securityDeposit)) : "—"}
          </div>
        </div>
      ),
      width: "150px",
      sortable: true,
    },
    {
      id: "agent",
      label: "Agent",
      accessor: (c) => (
        <div>
          <div className="text-sm text-gray-900">{c.agent?.name ?? "—"}</div>
          <div className="text-xs text-gray-500">{c.agent?.email ?? ""}</div>
        </div>
      ),
      width: "150px",
    },
    {
      id: "leasePeriod",
      label: "Lease Period",
      accessor: (c) => (
        <div className="text-sm text-gray-900">
          {c.leasePeriod} month{c.leasePeriod !== 1 ? "s" : ""}
        </div>
      ),
      width: "120px",
      sortable: true,
    },
    {
      id: "status",
      label: "Status",
      accessor: (c) => {
        // Normalise enum values (e.g. ACTIVE → Active)
        const label = c.status
          .replace(/_/g, " ")
          .toLowerCase()
          .replace(/\b\w/g, (l) => l.toUpperCase());
        return <StatusBadge status={label} size="sm" />;
      },
      width: "160px",
      sortable: true,
    },
    {
      id: "availableFrom",
      label: "Available From",
      accessor: (c) => (
        <div className="text-sm text-gray-900">
          {c.availableFrom
            ? new Date(c.availableFrom).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
            : "—"}
        </div>
      ),
      width: "130px",
      sortable: true,
    },
    {
      id: "leases",
      label: "Active Lease",
      accessor: (c) => {
        const activeLease = c.leases?.find(
          (l) => l.status === "ACTIVE",
        );
        return (
          <div className="text-sm text-gray-900">
            {activeLease ? (
              <span className="text-green-600">
                {activeLease.tenantContact?.name ?? "Tenant"}
              </span>
            ) : (
              <span className="text-gray-400">Vacant</span>
            )}
          </div>
        );
      },
      width: "130px",
    },
  ];

  // Define quick filters
  // Quick filters use backend enum values (uppercase)
  const quickFilters = [
    {
      id: "status",
      label: "Status",
      options: [
        { value: "LISTED", label: "Listed", count: allCycles.filter((c) => c.status === "LISTED").length },
        { value: "AVAILABLE", label: "Available", count: allCycles.filter((c) => c.status === "AVAILABLE").length },
        { value: "SHOWING", label: "Showing", count: allCycles.filter((c) => c.status === "SHOWING").length },
        { value: "APPLICATION_RECEIVED", label: "Application Received", count: allCycles.filter((c) => c.status === "APPLICATION_RECEIVED").length },
        { value: "LEASED", label: "Leased", count: allCycles.filter((c) => c.status === "LEASED").length },
        { value: "ACTIVE", label: "Active", count: allCycles.filter((c) => c.status === "ACTIVE").length },
        { value: "RENEWAL_PENDING", label: "Renewal Pending", count: allCycles.filter((c) => c.status === "RENEWAL_PENDING").length },
        { value: "ENDING", label: "Ending", count: allCycles.filter((c) => c.status === "ENDING").length },
        { value: "ENDED", label: "Ended", count: allCycles.filter((c) => c.status === "ENDED").length },
      ],
      multiple: true,
    },
    {
      id: "leasePeriod",
      label: "Lease Period",
      options: [
        { value: "6", label: "6 months", count: allCycles.filter((c) => c.leasePeriod === 6).length },
        { value: "12", label: "12 months", count: allCycles.filter((c) => c.leasePeriod === 12).length },
        { value: "24", label: "24 months", count: allCycles.filter((c) => c.leasePeriod === 24).length },
        { value: "36", label: "36+ months", count: allCycles.filter((c) => c.leasePeriod >= 36).length },
      ],
      multiple: true,
    },
    {
      id: "occupancy",
      label: "Occupancy",
      options: [
        { value: "occupied", label: "Occupied", count: allCycles.filter((c) => c.leases?.some((l) => l.status === "ACTIVE")).length },
        { value: "vacant", label: "Vacant", count: allCycles.filter((c) => !c.leases?.some((l) => l.status === "ACTIVE")).length },
      ],
      multiple: false,
    },
  ];

  // Define sort options
  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "rent-high", label: "Rent: High to Low" },
    { value: "rent-low", label: "Rent: Low to High" },
    { value: "lease-ending", label: "Lease Ending Soon" },
  ];

  // Bulk actions
  const bulkActions = [
    {
      id: "export",
      label: "Export Selected",
      icon: <Download className="h-4 w-4" />,
      onClick: (ids: string[]) => {
        const selected = allCycles.filter((c) =>
          ids.includes(c.id),
        );
        logger.log("Exporting cycles:", selected);
        toast.success(
          `Exporting ${ids.length} cycle${ids.length > 1 ? "s" : ""}`,
        );
      },
    },
    {
      id: "delete",
      label: "Delete Selected",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (ids: string[]) => {
        logger.log("Delete cycles:", ids);
        toast.info(`${ids.length} cycle${ids.length > 1 ? "s" : ""} marked for deletion`);
      },
      variant: "destructive" as const,
    },
  ];

  // Filter function — WorkspacePageTemplate passes activeFilters as Map<string, any>
  const handleFilter = useCallback((
    cycle: RentCycleApiResponse,
    activeFilters: Map<string, any>,
  ): boolean => {
    const status = activeFilters.get("status");
    if (Array.isArray(status) && status.length > 0 && !status.includes(cycle.status)) {
      return false;
    }
    const leasePeriod = activeFilters.get("leasePeriod");
    if (Array.isArray(leasePeriod) && leasePeriod.length > 0) {
      const periods = leasePeriod.map((p: string) => parseInt(p, 10));
      const matchesPeriod = periods.some((p: number) => {
        if (p === 36) return cycle.leasePeriod >= 36;
        return cycle.leasePeriod === p;
      });
      if (!matchesPeriod) return false;
    }
    const occupancy = activeFilters.get("occupancy");
    if (occupancy) {
      const isOccupied = cycle.leases?.some((l) => l.status === "ACTIVE") ?? false;
      if (occupancy === "occupied" && !isOccupied) return false;
      if (occupancy === "vacant" && isOccupied) return false;
    }
    return true;
  }, []);

  // Sort function — monthlyRent is a Decimal string from the API
  const handleSort = useCallback((
    cycles: RentCycleApiResponse[],
    sortBy: string,
    _order?: "asc" | "desc",
  ): RentCycleApiResponse[] => {
    const sorted = [...cycles];
    switch (sortBy) {
      case "newest":
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "oldest":
        sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case "rent-high":
        sorted.sort((a, b) => parseFloat(b.monthlyRent) - parseFloat(a.monthlyRent));
        break;
      case "rent-low":
        sorted.sort((a, b) => parseFloat(a.monthlyRent) - parseFloat(b.monthlyRent));
        break;
      case "available-soon":
        sorted.sort((a, b) => {
          const da = a.availableFrom ? new Date(a.availableFrom).getTime() : Infinity;
          const db = b.availableFrom ? new Date(b.availableFrom).getTime() : Infinity;
          return da - db;
        });
        break;
      default:
        break;
    }
    return sorted;
  }, []);

  // Search function
  const handleSearch = useCallback((cycle: RentCycleApiResponse, query: string): boolean => {
    const q = query.toLowerCase();
    const address = cycle.propertyListing?.masterProperty?.address;
    const city = address?.city?.name?.toLowerCase() ?? "";
    const area = address?.area?.name?.toLowerCase() ?? "";
    return (
      (cycle.agent?.name?.toLowerCase().includes(q) ?? false) ||
      (cycle.cycleNumber?.toLowerCase().includes(q) ?? false) ||
      city.includes(q) ||
      area.includes(q) ||
      cycle.monthlyRent.includes(q)
    );
  }, []);

  return (
    <WorkspacePageTemplate
      // Header
      title="Rent Cycles"
      description="Manage property rentals and lease agreements"
      stats={stats}

      // Primary action — navigates to properties to pick one first
      primaryAction={{
        label: "Start Rent Cycle",
        icon: <Plus className="w-4 h-4" />,
        onClick: onStartNew ?? (() => toast.info("Select a property first to start a rent cycle")),
      }}

      // Secondary actions
      secondaryActions={[
        {
          label: "Export All",
          icon: <Download className="w-4 h-4" />,
          onClick: () => toast.info("Export All clicked"),
        },
      ]}

      // View configuration
      defaultView="grid"
      availableViews={["grid", "table"]}

      // Data — real API data from backend
      items={allCycles}
      getItemId={(cycle) => cycle.id}

      // Table view
      columns={columns}

      // Grid view
      renderCard={(cycle) => (
        <RentCycleWorkspaceCard
          cycle={cycle as unknown as RentCycle}
          property={null}
          onClick={() => onNavigate("rent-cycle-details", cycle.id)}
          onEdit={() => onEditCycle?.(cycle)}
          onDelete={() => toast.info(`Delete cycle ${cycle.id}`)}
        />
      )}

      // Search & Filter
      searchPlaceholder="Search by cycle number, city, area, agent..."
      onSearch={handleSearch}
      quickFilters={quickFilters}
      onFilter={handleFilter}
      sortOptions={sortOptions}
      onSort={handleSort}

      // Bulk actions
      bulkActions={bulkActions}

      // Item actions — navigate to detail page
      onItemClick={(cycle) => onNavigate("rent-cycle-details", cycle.id)}

      // Empty state
      emptyStatePreset={{
        title: "No rent cycles yet",
        description: "Create rent cycles to manage property leases and tenant relationships",
        primaryAction: {
          label: "Start Rent Cycle",
          onClick: onStartNew ?? (() => { }),
        },
        guideItems: [
          { title: "Select a property", description: "Go to Properties and select a listing" },
          { title: "Set rental terms", description: "Configure monthly rent, deposit and lease period" },
          { title: "List and find tenants", description: "Publish to attract tenant applications" },
        ],
      }}

      isLoading={isLoading}
      pagination={{ enabled: true, pageSize: 12, pageSizeOptions: [12, 24, 48] }}
    />
  );
};
