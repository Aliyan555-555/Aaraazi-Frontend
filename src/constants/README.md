# Frontend Constants

This directory contains professional-grade constants that mirror the backend Prisma schema enums. Use these constants instead of string literals throughout the application for type safety, consistency, and maintainability.

## Usage

### Import Constants

```typescript
import { 
  OFFER_STATUS, 
  SELL_CYCLE_STATUS,
  PROPERTY_LISTING_STATUS 
} from '@/constants';
```

### Using Constants

**❌ Bad - String Literals:**
```typescript
if (offer.status === 'submitted') {
  // ...
}

if (cycle.status === 'listed') {
  // ...
}
```

**✅ Good - Using Constants:**
```typescript
import { OFFER_STATUS, SELL_CYCLE_STATUS } from '@/constants';

if (offer.status === OFFER_STATUS.SUBMITTED) {
  // ...
}

if (cycle.status === SELL_CYCLE_STATUS.LISTED) {
  // ...
}
```

## Available Constants

### OFFER_STATUS (Frontend Format - Lowercase)
Status values for offers in the UI. These are the lowercase versions used in the frontend.

```typescript
OFFER_STATUS.DRAFTED     // 'drafted'
OFFER_STATUS.PENDING     // 'pending'
OFFER_STATUS.SUBMITTED   // 'submitted'
OFFER_STATUS.ACCEPTED    // 'accepted'
OFFER_STATUS.REJECTED    // 'rejected'
OFFER_STATUS.WITHDRAWN   // 'withdrawn'
OFFER_STATUS.COUNTERED   // 'countered'
OFFER_STATUS.EXPIRED     // 'expired'
```

### DEAL_OFFER_STATUS (Backend Format - Uppercase)
Use these when communicating with the API.

```typescript
DEAL_OFFER_STATUS.DRAFTED
DEAL_OFFER_STATUS.PENDING
DEAL_OFFER_STATUS.SUBMITTED
DEAL_OFFER_STATUS.ACCEPTED
DEAL_OFFER_STATUS.REJECTED
DEAL_OFFER_STATUS.WITHDRAWN
DEAL_OFFER_STATUS.COUNTERED
DEAL_OFFER_STATUS.EXPIRED
```

### SELL_CYCLE_STATUS (Frontend Format)
Status values for sell cycles in the UI.

```typescript
SELL_CYCLE_STATUS.LISTED          // 'listed'
SELL_CYCLE_STATUS.OFFER_RECEIVED  // 'offer-received'
SELL_CYCLE_STATUS.NEGOTIATION     // 'negotiation'
SELL_CYCLE_STATUS.UNDER_CONTRACT  // 'under-contract'
SELL_CYCLE_STATUS.SOLD            // 'sold'
SELL_CYCLE_STATUS.CANCELLED       // 'cancelled'
SELL_CYCLE_STATUS.ON_HOLD         // 'on-hold'
SELL_CYCLE_STATUS.PENDING         // 'pending'
```

### CYCLE_STATUS (Backend Format)
Use these for mapping API responses.

```typescript
CYCLE_STATUS.ACTIVE
CYCLE_STATUS.LISTED
CYCLE_STATUS.OFFER_RECEIVED
CYCLE_STATUS.NEGOTIATION
CYCLE_STATUS.UNDER_CONTRACT
CYCLE_STATUS.SOLD
CYCLE_STATUS.CANCELLED
```

## TypeScript Types

Each constant object has a corresponding TypeScript type:

```typescript
import type { 
  OfferStatus, 
  SellCycleStatus 
} from '@/constants';

function getOfferBadgeColor(status: OfferStatus): string {
  // TypeScript ensures status is one of OFFER_STATUS values
  switch (status) {
    case OFFER_STATUS.ACCEPTED:
      return 'success';
    case OFFER_STATUS.REJECTED:
      return 'danger';
    default:
      return 'warning';
  }
}
```

## Component Examples

### Example 1: Filtering Offers

```typescript
import { OFFER_STATUS } from '@/constants';

function OffersTable({ offers }: { offers: Offer[] }) {
  const pendingOffers = offers.filter(
    (o) => 
      o.status === OFFER_STATUS.PENDING || 
      o.status === OFFER_STATUS.SUBMITTED
  );
  
  const acceptedOffers = offers.filter(
    (o) => o.status === OFFER_STATUS.ACCEPTED
  );
  
  return (
    <div>
      <h3>Pending: {pendingOffers.length}</h3>
      <h3>Accepted: {acceptedOffers.length}</h3>
    </div>
  );
}
```

### Example 2: Conditional Rendering

```typescript
import { OFFER_STATUS, SELL_CYCLE_STATUS } from '@/constants';

function OfferActions({ offer, cycle }: Props) {
  const canAccept = 
    (offer.status === OFFER_STATUS.SUBMITTED || 
     offer.status === OFFER_STATUS.COUNTERED) &&
    cycle.status !== SELL_CYCLE_STATUS.SOLD &&
    cycle.status !== SELL_CYCLE_STATUS.CANCELLED;
  
  return (
    <>
      {canAccept && (
        <>
          <Button onClick={() => handleAccept(offer.id)}>Accept</Button>
          <Button onClick={() => handleCounter(offer.id)}>Counter</Button>
          <Button onClick={() => handleReject(offer.id)}>Reject</Button>
        </>
      )}
    </>
  );
}
```

### Example 3: Status Badge Component

```typescript
import { OFFER_STATUS, type OfferStatus } from '@/constants';
import { Badge } from '@/components/ui/badge';

function OfferStatusBadge({ status }: { status: OfferStatus }) {
  const config = {
    [OFFER_STATUS.ACCEPTED]: { variant: 'success', label: 'Accepted' },
    [OFFER_STATUS.REJECTED]: { variant: 'destructive', label: 'Rejected' },
    [OFFER_STATUS.SUBMITTED]: { variant: 'default', label: 'Submitted' },
    [OFFER_STATUS.COUNTERED]: { variant: 'warning', label: 'Countered' },
    [OFFER_STATUS.PENDING]: { variant: 'secondary', label: 'Pending' },
  };
  
  const { variant, label } = config[status] || config[OFFER_STATUS.PENDING];
  
  return <Badge variant={variant}>{label}</Badge>;
}
```

## Benefits

1. **Type Safety**: TypeScript catches typos at compile time
2. **Autocomplete**: IDE suggests available values
3. **Refactoring**: Easy to find and update all usages
4. **Consistency**: Same values across the entire frontend
5. **Documentation**: Constants are self-documenting

## Mapping Backend to Frontend

When receiving data from the API, map backend enums to frontend constants:

```typescript
import { CYCLE_STATUS, SELL_CYCLE_STATUS } from '@/constants';

function mapApiCycleToSellCycle(apiCycle: ApiSellCycle): SellCycle {
  const statusMap = {
    [CYCLE_STATUS.LISTED]: SELL_CYCLE_STATUS.LISTED,
    [CYCLE_STATUS.OFFER_RECEIVED]: SELL_CYCLE_STATUS.OFFER_RECEIVED,
    [CYCLE_STATUS.NEGOTIATION]: SELL_CYCLE_STATUS.NEGOTIATION,
    [CYCLE_STATUS.UNDER_CONTRACT]: SELL_CYCLE_STATUS.UNDER_CONTRACT,
    [CYCLE_STATUS.SOLD]: SELL_CYCLE_STATUS.SOLD,
  };
  
  return {
    ...apiCycle,
    status: statusMap[apiCycle.status] || SELL_CYCLE_STATUS.PENDING,
  };
}
```

## Maintenance

When backend enum values change:

1. Update `EstateManagerBackend/prisma/schema.prisma`
2. Update `EstateManagerWeb/src/constants/enums.ts`
3. Update this README with new constants
4. Search for string literals that should use the new constants

## Migration from String Literals

To migrate existing code:

1. Import the appropriate constant
2. Replace string literals with constant references
3. Run TypeScript compiler to catch any issues
4. Test thoroughly

**Before:**
```typescript
if (offer.status === 'submitted' || offer.status === 'pending') {
  // ...
}
```

**After:**
```typescript
import { OFFER_STATUS } from '@/constants';

if (offer.status === OFFER_STATUS.SUBMITTED || offer.status === OFFER_STATUS.PENDING) {
  // ...
}
```
