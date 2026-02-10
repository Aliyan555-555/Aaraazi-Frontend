import {
  Property,
  OwnershipRecord,
  Transaction,
  Contact,
  InvestorShare,
} from "../types";
import {
  getPropertyById,
  updateProperty,
  getContacts,
  getProperties,
} from "./data";
import { saveTransaction } from "./transactions";
import { addInvestorInvestment } from "./investors";

// ============================================================================
// OWNERSHIP LIFECYCLE MANAGEMENT
// ============================================================================

/**
 * Transfer ownership of a property from one owner to another
 * This is the core function that enables the Asset-Centric model
 *
 * ENHANCED: Now supports owner types and investor tracking
 */
export function transferOwnership(
  propertyId: string,
  newOwnerContactId: string,
  newOwnerName: string,
  newOwnerType: "client" | "agency" | "investor" | "external", // NEW PARAM
  transactionId?: string,
  investorShares?: InvestorShare[], // NEW PARAM for multi-investor
  salePrice?: number, // NEW PARAM for investment tracking
  notes?: string,
): Property | null {
  console.log("🔄 transferOwnership called with:");
  console.log("   - propertyId:", propertyId);
  console.log("   - newOwnerContactId:", newOwnerContactId);
  console.log("   - newOwnerName:", newOwnerName);
  console.log("   - newOwnerType:", newOwnerType);
  console.log("   - transactionId:", transactionId);
  console.log("   - investorShares:", investorShares);
  console.log("   - salePrice:", salePrice);
  console.log("   - notes:", notes);

  try {
    const property = getPropertyById(propertyId);
    if (!property) {
      console.error("❌ transferOwnership FAILED: Property not found");
      console.error("   - Searched for property ID:", propertyId);
      return null;
    }

    console.log("✅ Property found:", property.address);
    console.log("   - Current owner ID:", property.currentOwnerId);
    console.log("   - Current owner type:", property.currentOwnerType);
    console.log(
      "   - Current ownership history length:",
      property.ownershipHistory?.length || 0,
    );

    const now = new Date().toISOString();
    console.log("   - Timestamp:", now);

    // Initialize ownership history if it doesn't exist
    const ownershipHistory = property.ownershipHistory || [];
    console.log(
      "   - Ownership history initialized, length:",
      ownershipHistory.length,
    );

    // End the current ownership record
    if (property.currentOwnerId) {
      console.log(
        "   - Ending current ownership for:",
        property.currentOwnerId,
      );
      const currentOwnershipIndex = ownershipHistory.findIndex(
        (record) =>
          record.ownerId === property.currentOwnerId && !record.soldDate,
      );

      if (currentOwnershipIndex >= 0) {
        ownershipHistory[currentOwnershipIndex].soldDate = now;
        ownershipHistory[currentOwnershipIndex].salePrice = salePrice;
        console.log("   - Ended ownership at index:", currentOwnershipIndex);
      } else {
        console.log("   - No active ownership record found to end");
      }
    } else {
      console.log("   - No current owner to end ownership for");
    }

    // Add new ownership record
    const newOwnershipRecord: OwnershipRecord = {
      ownerId: newOwnerContactId,
      ownerName: newOwnerName,
      acquiredDate: now,
      transactionId,
      salePrice,
      notes,
    };

    console.log("   - Creating new ownership record:", newOwnershipRecord);
    ownershipHistory.push(newOwnershipRecord);
    console.log("   - New ownership history length:", ownershipHistory.length);

    // Handle investor tracking
    if (newOwnerType === "investor" && investorShares && salePrice) {
      console.log("   - Processing investor investment records...");
      for (const share of investorShares) {
        try {
          addInvestorInvestment(share.investorId, propertyId, {
            propertyAddress: property.address,
            sharePercentage: share.sharePercentage,
            investmentAmount: salePrice * (share.sharePercentage / 100),
            acquisitionPrice: salePrice,
            notes: share.notes,
          });
          console.log(
            `   - Added investment record for investor: ${share.investorName} (${share.sharePercentage}%)`,
          );
        } catch (error) {
          console.error(
            `   - Error adding investment for ${share.investorName}:`,
            error,
          );
        }
      }
    }

    // Update the property
    console.log("   - Calling updateProperty with:");
    console.log("     - currentOwnerId:", newOwnerContactId);
    console.log("     - currentOwnerName:", newOwnerName);
    console.log("     - currentOwnerType:", newOwnerType);
    console.log("     - ownershipHistory length:", ownershipHistory.length);
    console.log("     - investorShares:", investorShares ? "present" : "none");

    const updatedProperty = updateProperty(propertyId, {
      currentOwnerId: newOwnerContactId,
      currentOwnerName: newOwnerName,
      currentOwnerType: newOwnerType,
      investorShares: investorShares || undefined,
      ownershipHistory,
    });

    if (!updatedProperty) {
      console.error(
        "❌ transferOwnership FAILED: updateProperty returned null",
      );
      return null;
    }

    console.log("✅ transferOwnership SUCCESS");
    console.log(
      "   - Updated property current owner:",
      updatedProperty.currentOwnerId,
    );
    console.log("   - Updated owner type:", updatedProperty.currentOwnerType);
    console.log(
      "   - Updated ownership history length:",
      updatedProperty.ownershipHistory?.length || 0,
    );

    // Dispatch event for UI refresh
    window.dispatchEvent(
      new CustomEvent("propertyUpdated", {
        detail: { propertyId, ownerType: newOwnerType },
      }),
    );

    return updatedProperty;
  } catch (error) {
    console.error("❌ transferOwnership FAILED with exception:", error);
    console.error("   - Error details:", error);
    return null;
  }
}

/**
 * Get the current owner of a property
 */
export function getCurrentOwner(propertyId: string): {
  contactId: string;
  contactName: string;
  ownershipStartDate: string;
} | null {
  try {
    const property = getPropertyById(propertyId);
    if (!property || !property.currentOwnerId) {
      return null;
    }

    const currentOwnershipRecord = property.ownershipHistory?.find(
      (record) =>
        record.ownerId === property.currentOwnerId && !record.soldDate,
    );

    if (!currentOwnershipRecord) {
      return {
        contactId: property.currentOwnerId,
        contactName: "Unknown Owner",
        ownershipStartDate: property.createdAt,
      };
    }

    return {
      contactId: currentOwnershipRecord.ownerId,
      contactName: currentOwnershipRecord.ownerName,
      ownershipStartDate: currentOwnershipRecord.acquiredDate,
    };
  } catch (error) {
    console.error("Error getting current owner:", error);
    return null;
  }
}

/**
 * Get complete ownership history for a property
 */
export function getOwnershipHistory(propertyId: string): OwnershipRecord[] {
  try {
    const property = getPropertyById(propertyId);
    if (!property) {
      return [];
    }

    return property.ownershipHistory || [];
  } catch (error) {
    console.error("Error getting ownership history:", error);
    return [];
  }
}

/**
 * Check if a property can be re-listed (i.e., bought back by the agency)
 */
export function canRelist(propertyId: string): {
  canRelist: boolean;
  reason?: string;
} {
  try {
    const property = getPropertyById(propertyId);
    if (!property) {
      return { canRelist: false, reason: "Property not found" };
    }

    // Property can be re-listed if:
    // 1. It's marked as sold/off-market
    // 2. It has a current owner that is NOT the agency

    if (
      property.status === "sold" &&
      property.currentOwnerId &&
      property.currentOwnerId !== "AGENCY"
    ) {
      return { canRelist: true };
    }

    if (property.currentOwnerId === "AGENCY") {
      return { canRelist: false, reason: "Property already owned by agency" };
    }

    return { canRelist: false, reason: "Property is not in a sold state" };
  } catch (error) {
    console.error("Error checking relist eligibility:", error);
    return { canRelist: false, reason: "Error checking eligibility" };
  }
}

/**
 * Re-list a property (buy it back for the agency inventory)
 * This creates a new transaction and transfers ownership back to the agency
 */
export function relistProperty(
  propertyId: string,
  purchaseDetails: {
    purchasePrice: number;
    associatedCosts: number;
    purchaseDate: string;
    paymentSource: string;
    sellerContactId: string;
    sellerName: string;
  },
  agentId: string,
): {
  success: boolean;
  transaction?: Transaction;
  property?: Property;
  error?: string;
} {
  try {
    const property = getPropertyById(propertyId);
    if (!property) {
      return { success: false, error: "Property not found" };
    }

    const { canRelist: isEligible, reason } = canRelist(propertyId);
    if (!isEligible) {
      return {
        success: false,
        error: reason || "Property cannot be re-listed",
      };
    }

    // Create a new transaction for the re-purchase
    const newTransaction: Transaction = {
      id: `txn-${Date.now()}`,
      propertyId,
      type: "purchase",
      agreedPrice: purchaseDetails.purchasePrice,
      startDate: purchaseDetails.purchaseDate,
      buyerName: "Agency", // The agency is buying back the property
      buyerContact: "",
      buyerEmail: "",
      buyerContactId: "AGENCY",
      acceptedOfferAmount: purchaseDetails.purchasePrice,
      status: "completed", // Mark as completed since this is a purchase
      agentId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save the transaction
    saveTransaction(newTransaction);

    // Transfer ownership back to the agency
    const updatedProperty = transferOwnership(
      propertyId,
      "AGENCY",
      "Agency Inventory",
      "agency",
      newTransaction.id,
      undefined,
      purchaseDetails.purchasePrice,
      `Re-purchased from ${purchaseDetails.sellerName} for ${purchaseDetails.purchasePrice}`,
    );

    if (!updatedProperty) {
      return { success: false, error: "Failed to transfer ownership" };
    }

    // Update property details
    const totalCostBasis =
      purchaseDetails.purchasePrice + purchaseDetails.associatedCosts;

    const finalProperty = updateProperty(propertyId, {
      status: "available", // Make it available for resale
      acquisitionType: "agency-purchase",
      purchaseDetails: {
        purchasePrice: purchaseDetails.purchasePrice,
        associatedCosts: purchaseDetails.associatedCosts,
        totalCostBasis,
        purchaseDate: purchaseDetails.purchaseDate,
        paymentSource: purchaseDetails.paymentSource,
      },
      unitCostBasis: totalCostBasis,
      currentOwnerId: "AGENCY",
    });

    return {
      success: true,
      transaction: newTransaction,
      property: finalProperty || undefined,
    };
  } catch (error) {
    console.error("Error re-listing property:", error);
    return {
      success: false,
      error: "An error occurred while re-listing the property",
    };
  }
}

/**
 * Finalize a sale transaction and transfer ownership to the buyer
 */
export function finalizeSale(
  propertyId: string,
  transactionId: string,
  buyerContactId: string,
  buyerName: string,
  finalSalePrice?: number,
): { success: boolean; property?: Property; error?: string } {
  try {
    const property = getPropertyById(propertyId);
    if (!property) {
      return { success: false, error: "Property not found" };
    }

    // Transfer ownership to the buyer
    const updatedProperty = transferOwnership(
      propertyId,
      buyerContactId,
      buyerName,
      "client",
      transactionId,
      undefined,
      finalSalePrice,
      `Sold to ${buyerName} for ${finalSalePrice || property.price || 0}`,
    );

    if (!updatedProperty) {
      return { success: false, error: "Failed to transfer ownership" };
    }

    // Update property status
    const finalProperty = updateProperty(propertyId, {
      status: "sold",
      finalSalePrice: finalSalePrice || property.price,
      soldDate: new Date().toISOString(),
    });

    return {
      success: true,
      property: finalProperty || undefined,
    };
  } catch (error) {
    console.error("Error finalizing sale:", error);
    return {
      success: false,
      error: "An error occurred while finalizing the sale",
    };
  }
}

/**
 * Get all properties that can be re-listed
 */
export function getRelistableProperties(
  agentId?: string,
  userRole?: string,
): Property[] {
  try {
    const allProperties = getProperties(agentId, userRole);

    return allProperties.filter((property) => {
      const { canRelist: isEligible } = canRelist(property.id);
      return isEligible;
    });
  } catch (error) {
    console.error("Error getting relistable properties:", error);
    return [];
  }
}

/**
 * Get ownership duration in days
 */
export function getOwnershipDuration(ownershipRecord: OwnershipRecord): number {
  const startDate = new Date(ownershipRecord.acquiredDate);
  const endDate = ownershipRecord.soldDate
    ? new Date(ownershipRecord.soldDate)
    : new Date();

  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Get total number of times a property has been sold
 */
export function getPropertySalesCount(propertyId: string): number {
  try {
    const property = getPropertyById(propertyId);
    if (!property || !property.ownershipHistory) {
      return 0;
    }

    // Count completed ownership records (those with end dates)
    return property.ownershipHistory.filter((record) => record.soldDate).length;
  } catch (error) {
    console.error("Error getting property sales count:", error);
    return 0;
  }
}
