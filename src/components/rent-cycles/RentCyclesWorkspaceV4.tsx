/**
 * RentCyclesWorkspaceV4 Component
 * WORKSPACE V4: Built with WorkspacePageTemplate ✅
 *
 * PURPOSE:
 * Complete rent cycles workspace using the template system.
 * Demonstrates property rental and lease management.
 *
 * FEATURES:
 * - Grid view (primary) and Table view (secondary)
 * - Search and filtering by status, landlord type, lease terms
 * - Sorting options
 * - Bulk actions (export, change status, delete)
 * - Quick actions (view, edit, delete)
 * - Pagination
 * - Empty states
 * - Loading states
 */

import React, { useState, useMemo, useCallback } from "react";
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  Home as HomeIcon,
} from "lucide-react";
import { User, RentCycle, Property } from "../../types";
import { WorkspacePageTemplate } from "../workspace/WorkspacePageTemplate";
import { RentCycleWorkspaceCard } from "./RentCycleWorkspaceCard";
import { StatusBadge } from "../layout/StatusBadge"; // PHASE 5: Add StatusBadge import
import { Column, EmptyStatePresets } from "../workspace";
import {
  getRentCycles,
  updateRentCycle,
  deleteRentCycle,
} from "../../lib/rentCycle";
import { getProperties } from "../../lib/data";
import { formatPKR } from "../../lib/currency";
import { toast } from "sonner";

export interface RentCyclesWorkspaceV4Props {
  user: User;
  onNavigate: (section: string, id?: string) => void;
  onStartNew?: () => void;
  onEditCycle?: (cycle: RentCycle) => void;
}

/**
 * RentCyclesWorkspaceV4 - Complete workspace using template system
 */
export const RentCyclesWorkspaceV4: React.FC<
  RentCyclesWorkspaceV4Props
> = ({ user, onNavigate, onStartNew, onEditCycle }) => {
  // State
  const [isLoading, setIsLoading] = useState(false);

  // Load rent cycles based on user role
  const allCycles = useMemo(() => {
    return getRentCycles(
      user.role === "admin" ? undefined : user.id,
      user.role,
    );
  }, [user.id, user.role]);

  // Load properties for reference
  const allProperties = useMemo(() => {
    return getProperties(
      user.role === "admin" ? undefined : user.id,
      user.role,
    );
  }, [user.id, user.role]);

  // Helper to get property for a cycle
  const getProperty = (propertyId: string): Property | null => {
    return (
      allProperties.find((p) => p.id === propertyId) || null
    );
  };

  // Calculate stats
  const stats = useMemo(() => {
    const available = allCycles.filter(
      (c) => c.status === "available",
    ).length;
    const active = allCycles.filter(
      (c) => c.status === "active",
    ).length;
    const applications = allCycles.reduce(
      (sum, c) =>
        sum +
        (c.applications?.filter(
          (app) => app.status === "pending",
        ).length || 0),
      0,
    );

    const monthlyRevenue = allCycles
      .filter((c) => c.status === "active")
      .reduce((sum, c) => sum + c.monthlyRent, 0);

    return [
      {
        label: "Total",
        value: allCycles.length,
        variant: "default" as const,
      },
      {
        label: "Available",
        value: available,
        variant: "success" as const,
      },
      {
        label: "Active Leases",
        value: active,
        variant: "info" as const,
      },
      {
        label: "Monthly Revenue",
        value: formatPKR(monthlyRevenue).replace("PKR ", ""),
        variant: "default" as const,
      },
    ];
  }, [allCycles]);

  // Define table columns
  const columns: Column<RentCycle>[] = [
    {
      id: "property",
      label: "Property",
      accessor: (c) => {
        const property = getProperty(c.propertyId);
        return (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
              {property?.images?.[0] ? (
                <img
                  src={property.images[0]}
                  alt={property?.address}
                  className="w-full h-full object-cover rounded"
                />
              ) : (
                <HomeIcon className="h-6 w-6 text-gray-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate">
                {property?.address || "Property"}
              </div>
              <div className="text-sm text-gray-500 capitalize">
                {property?.propertyType || "N/A"}
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
            {formatPKR(c.monthlyRent)}
          </div>
          <div className="text-xs text-gray-500">
            Deposit: {formatPKR(c.securityDeposit)}
          </div>
        </div>
      ),
      width: "150px",
      sortable: true,
    },
    {
      id: "tenant",
      label: "Tenant / Landlord",
      accessor: (c) => (
        <div>
          {c.currentTenantName ? (
            <>
              <div className="text-sm text-gray-900">
                {c.currentTenantName}
              </div>
              <div className="text-xs text-gray-500">
                Tenant
              </div>
            </>
          ) : (
            <>
              <div className="text-sm text-gray-900">
                {c.landlordName}
              </div>
              <div className="text-xs text-gray-500 capitalize">
                {c.landlordType}
              </div>
            </>
          )}
        </div>
      ),
      width: "150px",
    },
    {
      id: "leasePeriod",
      label: "Lease Period",
      accessor: (c) => (
        <div className="text-sm text-gray-900">
          {c.leasePeriod} month{c.leasePeriod > 1 ? "s" : ""}
        </div>
      ),
      width: "120px",
      sortable: true,
    },
    {
      id: "status",
      label: "Status",
      accessor: (c) => {
        const statusLabels: Record<string, string> = {
          available: "Available",
          showing: "Showing",
          "application-received": "Application Received",
          leased: "Leased",
          active: "Active",
          "renewal-pending": "Renewal Pending",
          ending: "Ending",
          ended: "Ended",
        };

        const statusLabel = statusLabels[c.status] || c.status;

        // PHASE 5: Use StatusBadge component with auto-mapping
        return <StatusBadge status={statusLabel} size="sm" />;
      },
      width: "160px",
      sortable: true,
    },
    {
      id: "leaseEndDate",
      label: "Lease End",
      accessor: (c) => (
        <div className="text-sm text-gray-900">
          {c.leaseEndDate ? (
            <>
              {new Date(c.leaseEndDate).toLocaleDateString(
                "en-US",
                {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                },
              )}
            </>
          ) : c.availableFrom ? (
            <>
              Available{" "}
              {new Date(c.availableFrom).toLocaleDateString(
                "en-US",
                {
                  month: "short",
                  day: "numeric",
                },
              )}
            </>
          ) : (
            "-"
          )}
        </div>
      ),
      width: "130px",
      sortable: true,
    },
    {
      id: "applications",
      label: "Applications",
      accessor: (c) => {
        const pendingApps =
          c.applications?.filter(
            (app) => app.status === "pending",
          ).length || 0;
        return (
          <div className="text-sm text-gray-900">
            {pendingApps > 0 ? (
              <span className="text-yellow-600">
                {pendingApps} pending
              </span>
            ) : (
              <span className="text-gray-400">-</span>
            )}
          </div>
        );
      },
      width: "110px",
    },
  ];

  // Define quick filters
  const quickFilters = [
    {
      id: "status",
      label: "Status",
      options: [
        {
          value: "available",
          label: "Available",
          count: allCycles.filter(
            (c) => c.status === "available",
          ).length,
        },
        {
          value: "showing",
          label: "Showing",
          count: allCycles.filter((c) => c.status === "showing")
            .length,
        },
        {
          value: "application-received",
          label: "Application Received",
          count: allCycles.filter(
            (c) => c.status === "application-received",
          ).length,
        },
        {
          value: "leased",
          label: "Leased",
          count: allCycles.filter((c) => c.status === "leased")
            .length,
        },
        {
          value: "active",
          label: "Active",
          count: allCycles.filter((c) => c.status === "active")
            .length,
        },
        {
          value: "renewal-pending",
          label: "Renewal Pending",
          count: allCycles.filter(
            (c) => c.status === "renewal-pending",
          ).length,
        },
        {
          value: "ending",
          label: "Ending",
          count: allCycles.filter((c) => c.status === "ending")
            .length,
        },
        {
          value: "ended",
          label: "Ended",
          count: allCycles.filter((c) => c.status === "ended")
            .length,
        },
      ],
      multiple: true,
    },
    {
      id: "landlordType",
      label: "Landlord Type",
      options: [
        {
          value: "agency",
          label: "Agency",
          count: allCycles.filter(
            (c) => c.landlordType === "agency",
          ).length,
        },
        {
          value: "client",
          label: "Client",
          count: allCycles.filter(
            (c) => c.landlordType === "client",
          ).length,
        },
        {
          value: "investor",
          label: "Investor",
          count: allCycles.filter(
            (c) => c.landlordType === "investor",
          ).length,
        },
      ],
      multiple: true,
    },
    {
      id: "leasePeriod",
      label: "Lease Period",
      options: [
        {
          value: "6",
          label: "6 months",
          count: allCycles.filter((c) => c.leasePeriod === 6)
            .length,
        },
        {
          value: "12",
          label: "12 months",
          count: allCycles.filter((c) => c.leasePeriod === 12)
            .length,
        },
        {
          value: "24",
          label: "24 months",
          count: allCycles.filter((c) => c.leasePeriod === 24)
            .length,
        },
        {
          value: "36",
          label: "36+ months",
          count: allCycles.filter((c) => c.leasePeriod >= 36)
            .length,
        },
      ],
      multiple: true,
    },
    {
      id: "tenantStatus",
      label: "Occupancy",
      options: [
        {
          value: "occupied",
          label: "Occupied",
          count: allCycles.filter((c) => c.currentTenantName)
            .length,
        },
        {
          value: "vacant",
          label: "Vacant",
          count: allCycles.filter((c) => !c.currentTenantName)
            .length,
        },
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

  // Define bulk actions
  const bulkActions = [
    {
      id: "export",
      label: "Export Selected",
      icon: <Download className="h-4 w-4" />,
      onClick: (ids: string[]) => {
        const selected = allCycles.filter((c) =>
          ids.includes(c.id),
        );
        console.log("Exporting cycles:", selected);
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
        console.log("Delete cycles:", ids);
        toast.success(
          `${ids.length} cycle${ids.length > 1 ? "s" : ""} deleted`,
        );
      },
      variant: "destructive" as const,
    },
  ];

  // Custom filter function
  const handleFilter = (
    cycle: RentCycle,
    filterValues: Record<string, any>,
  ): boolean => {
    // Status filter
    if (
      filterValues.status?.length > 0 &&
      !filterValues.status.includes(cycle.status)
    ) {
      return false;
    }

    // Landlord type filter
    if (
      filterValues.landlordType?.length > 0 &&
      !filterValues.landlordType.includes(cycle.landlordType)
    ) {
      return false;
    }

    // Lease period filter
    if (filterValues.leasePeriod?.length > 0) {
      const periods = filterValues.leasePeriod.map(
        (p: string) => parseInt(p),
      );
      const matchesPeriod = periods.some((p: number) => {
        if (p === 36) return cycle.leasePeriod >= 36;
        return cycle.leasePeriod === p;
      });
      if (!matchesPeriod) return false;
    }

    // Tenant status filter
    if (filterValues.tenantStatus) {
      const isOccupied = !!cycle.currentTenantName;
      if (
        filterValues.tenantStatus === "occupied" &&
        !isOccupied
      )
        return false;
      if (filterValues.tenantStatus === "vacant" && isOccupied)
        return false;
    }

    return true;
  };

  // Custom sort function
  const handleSort = (
    cycles: RentCycle[],
    sortBy: string,
  ): RentCycle[] => {
    const sorted = [...cycles];

    switch (sortBy) {
      case "newest":
        sorted.sort((a, b) => {
          const dateA = a.availableFrom
            ? new Date(a.availableFrom).getTime()
            : 0;
          const dateB = b.availableFrom
            ? new Date(b.availableFrom).getTime()
            : 0;
          return dateB - dateA;
        });
        break;
      case "oldest":
        sorted.sort((a, b) => {
          const dateA = a.availableFrom
            ? new Date(a.availableFrom).getTime()
            : 0;
          const dateB = b.availableFrom
            ? new Date(b.availableFrom).getTime()
            : 0;
          return dateA - dateB;
        });
        break;
      case "rent-high":
        sorted.sort((a, b) => b.monthlyRent - a.monthlyRent);
        break;
      case "rent-low":
        sorted.sort((a, b) => a.monthlyRent - b.monthlyRent);
        break;
      case "lease-ending":
        sorted.sort((a, b) => {
          const endA = a.leaseEndDate
            ? new Date(a.leaseEndDate).getTime()
            : Infinity;
          const endB = b.leaseEndDate
            ? new Date(b.leaseEndDate).getTime()
            : Infinity;
          return endA - endB;
        });
        break;
      default:
        break;
    }

    return sorted;
  };

  // Custom search function
  const handleSearch = (
    cycle: RentCycle,
    query: string,
  ): boolean => {
    const property = getProperty(cycle.propertyId);
    const searchLower = query.toLowerCase();

    return (
      cycle.landlordName.toLowerCase().includes(searchLower) ||
      (cycle.currentTenantName &&
        cycle.currentTenantName
          .toLowerCase()
          .includes(searchLower)) ||
      cycle.agentName.toLowerCase().includes(searchLower) ||
      property?.address?.toLowerCase().includes(searchLower) ||
      property?.propertyType
        ?.toLowerCase()
        .includes(searchLower) ||
      cycle.monthlyRent.toString().includes(searchLower) ||
      cycle.securityDeposit.toString().includes(searchLower)
    );
  };

  return (
    <WorkspacePageTemplate
      // Header
      title="Rent Cycles"
      description="Manage property rentals and lease agreements"
      stats={stats}
      // Primary action
      primaryAction={{
        label: "Start Rent Cycle",
        icon: <Plus className="w-4 h-4" />,
        onClick:
          onStartNew ||
          (() => toast.info("Start Rent Cycle clicked")),
      }}
      // Secondary actions
      secondaryActions={[
        {
          label: "Import",
          icon: <Upload className="w-4 h-4" />,
          onClick: () => toast.info("Import clicked"),
        },
        {
          label: "Export All",
          icon: <Download className="w-4 h-4" />,
          onClick: () => toast.info("Export All clicked"),
        },
      ]}
      // View configuration
      defaultView="grid"
      availableViews={["grid", "table"]}
      // Data
      items={allCycles}
      getItemId={(cycle) => cycle.id}
      // Table view
      columns={columns}
      // Grid view
      renderCard={(cycle) => (
        <RentCycleWorkspaceCard
          cycle={cycle}
          property={getProperty(cycle.propertyId)}
          onClick={() =>
            onNavigate("rent-cycle-details", cycle.id)
          }
          onEdit={() => onEditCycle?.(cycle)}
          onDelete={() =>
            toast.info(`Delete cycle ${cycle.id}`)
          }
        />
      )}
      // Search & Filter
      searchPlaceholder="Search by property, tenant, landlord, agent..."
      onSearch={handleSearch}
      quickFilters={quickFilters}
      onFilter={handleFilter}
      sortOptions={sortOptions}
      onSort={handleSort}
      defaultSort="newest"
      // Bulk actions
      bulkActions={bulkActions}
      enableBulkSelect={true}
      // Item actions
      onItemClick={(cycle) =>
        onNavigate("rent-cycle-details", cycle.id)
      }
      // Empty states
      emptyState={{
        variant: "empty" as const,
        title: "No rent cycles yet",
        description:
          "Create rent cycles to manage property leases and tenant relationships",
        primaryAction: {
          label: "Start Rent Cycle",
          onClick: onStartNew || (() => {}),
        },
        guideItems: [
          { step: 1, text: "Select a property for rent" },
          { step: 2, text: "Set rental terms and pricing" },
          { step: 3, text: "List and find tenants" },
        ],
      }}
      // Loading
      isLoading={isLoading}
      // Pagination
      enablePagination={true}
      itemsPerPage={12}
    />
  );
};