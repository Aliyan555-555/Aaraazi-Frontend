"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { mapAuthUserToUIUser } from "@/types";
import { AlertCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlobalLoadingScreen } from "@/components/ui/GlobalLoadingScreen";
import { PurchaseCycleForm } from "@/components/PurchaseCycleForm";
import { useProperty } from "@/hooks/useProperties";
import { useCreatePurchaseCycleFromProperty } from "@/hooks/usePurchaseCycles";
import type { CreatePurchaseCycleFromPropertyPayload } from "@/lib/api/purchase-cycles";

const CYCLE_PROPERTY_ID_KEY = "cycle_property_id";

export default function NewPurchaseCyclePage() {
  const { user: saasUser } = useAuthStore();
  const router = useRouter();
  const [propertyId, setPropertyId] = useState<string | null>(null);

  useEffect(() => {
    const id = typeof window !== "undefined" ? sessionStorage.getItem(CYCLE_PROPERTY_ID_KEY) : null;
    setPropertyId(id);
  }, []);

  const { property, isLoading: loadingProperty, error: propertyError } = useProperty(propertyId ?? undefined);
  const { createFromProperty, isLoading: creating } = useCreatePurchaseCycleFromProperty();
  const user = useMemo(() => mapAuthUserToUIUser(saasUser), [saasUser]);

  const [lastCreatedCycleId, setLastCreatedCycleId] = useState<string | null>(null);

  const handleSubmitFromProperty = async (data: CreatePurchaseCycleFromPropertyPayload) => {
    try {
      const cycle = await createFromProperty(data);
      if (cycle?.id) {
        setLastCreatedCycleId(cycle.id);
      }
      return cycle ?? null;
    } catch (e) {
      console.error("Failed to create purchase cycle from property:", e);
      throw e;
    }
  };

  const handleBack = () => {
    router.push("/dashboard/purchase-cycles");
  };

  const handleSuccess = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(CYCLE_PROPERTY_ID_KEY);
    }
    if (lastCreatedCycleId) {
      router.push(`/dashboard/purchase-cycles/${lastCreatedCycleId}`);
      setLastCreatedCycleId(null);
    } else {
      router.push("/dashboard/purchase-cycles");
    }
  };

  if (!user) {
    return (
      <GlobalLoadingScreen
        message="Loading..."
        className="h-[calc(100vh-4rem)]"
        size="lg"
      />
    );
  }

  if (propertyId === null) {
    return (
      <div className="max-w-xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => router.push("/dashboard/purchase-cycles")}>
            Back
          </Button>
          <h1 className="text-xl font-semibold">Start Purchase Cycle</h1>
        </div>
        <div className="bg-amber-50 p-6 rounded-xl border border-amber-100 text-center">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-amber-900 mb-2">Select a property first</h3>
          <p className="text-amber-700 mb-6">
            Go to a property detail page and click &quot;Start Purchase Cycle&quot; to begin, or choose a property from the list below.
          </p>
          <Button onClick={() => router.push("/dashboard/properties")}>
            <Home className="w-4 h-4 mr-2" />
            Browse properties
          </Button>
        </div>
      </div>
    );
  }

  if (loadingProperty) {
    return (
      <GlobalLoadingScreen
        message="Loading property..."
        className="h-[calc(100vh-4rem)]"
        size="lg"
      />
    );
  }

  if (propertyError || !property) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] px-4">
        <div className="bg-red-50 p-6 rounded-xl border border-red-100 flex flex-col items-center max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Property not found</h3>
          <p className="text-red-700 mb-6">{propertyError || "Property not found or access denied."}</p>
          <Button
            variant="outline"
            onClick={() => {
              if (typeof window !== "undefined") sessionStorage.removeItem(CYCLE_PROPERTY_ID_KEY);
              router.push("/dashboard/purchase-cycles");
            }}
          >
            Back to Purchase Cycles
          </Button>
        </div>
      </div>
    );
  }

  return (
    <PurchaseCycleForm
      property={property}
      user={user}
      onBack={handleBack}
      onSuccess={handleSuccess}
      onSubmitFromProperty={handleSubmitFromProperty}
    />
  );
}
