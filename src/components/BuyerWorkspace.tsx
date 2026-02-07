import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import {
  ArrowLeft,
  Search,
  Plus,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Users,
  FileText,
  MapPin,
  Eye,
  Star,
  Building
} from 'lucide-react';
import { Property, Contact, User } from '../types';
import { getProperties, getContacts } from '../lib/data';
import {
  getSmartMatches,
  shortlistProperty,
  removeFromShortlist,
  getOffersByRequirement,
  PropertyMatch
} from '../lib/buyCycle';
import { formatPKR } from '../lib/currency';
import { RequirementFormModal } from './RequirementFormModal';
import { PropertyMatchCard } from './PropertyMatchCard';
import { ViewingFeedbackModal } from './ViewingFeedbackModal';
import { BuyerOfferModal } from './BuyerOfferModal';
import { CloseBuyerDealModal } from './CloseBuyerDealModal';

interface BuyerWorkspaceProps {
  user: User;
  onBack: () => void;
}

export function BuyerWorkspace({ user, onBack }: BuyerWorkspaceProps) {
  const [activeTab, setActiveTab] = useState('requirements');
  const [requirements, setRequirements] = useState<Property[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequirement, setSelectedRequirement] = useState<Property | null>(null);
  const [matches, setMatches] = useState<PropertyMatch[]>([]);
  const [showRequirementForm, setShowRequirementForm] = useState(false);
  const [showViewingModal, setShowViewingModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Load data
  useEffect(() => {
    loadData();
  }, [user]);

  // Load matches when requirement is selected
  useEffect(() => {
    if (selectedRequirement) {
      const propertyMatches = getSmartMatches(selectedRequirement.id);
      setMatches(propertyMatches);
    } else {
      setMatches([]);
    }
  }, [selectedRequirement]);

  const loadData = () => {
    const allProperties = getProperties(user.id, user.role);

    // Filter for "wanted" listings (buyer requirements)
    // ✅ RBAC FIX: Filter by agent ownership
    const wantedListings = allProperties.filter(p => {
      if (p.listingType !== 'wanted') return false;

      // Admin can see all
      if (user.role === 'admin') return true;

      // Agents see their own or shared requirements
      return p.agentId === user.id || p.sharedWith?.includes(user.id);
    });

    setRequirements(wantedListings);
    setContacts(getContacts(user.id, user.role));
  };

  // Filter requirements based on search
  const filteredRequirements = requirements.filter(req =>
    req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (req as any).preferredLocations?.some((loc: string) =>
      loc.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Statistics
  const stats = {
    totalRequirements: requirements.length,
    activeSearches: requirements.filter(r => r.status === 'available').length,
    offersSubmitted: requirements.filter(r => r.status === 'under-offer').length,
    acquired: requirements.filter(r => r.status === 'sold').length
  };

  const handleShortlist = (propertyId: string) => {
    if (selectedRequirement) {
      shortlistProperty(selectedRequirement.id, propertyId);
      loadData();

      // Refresh matches
      const propertyMatches = getSmartMatches(selectedRequirement.id);
      setMatches(propertyMatches);
    }
  };

  const handleRemoveShortlist = (propertyId: string) => {
    if (selectedRequirement) {
      removeFromShortlist(selectedRequirement.id, propertyId);
      loadData();

      // Refresh matches
      const propertyMatches = getSmartMatches(selectedRequirement.id);
      setMatches(propertyMatches);
    }
  };

  const handleViewingFeedback = (property: Property) => {
    setSelectedProperty(property);
    setShowViewingModal(true);
  };

  const handleDraftOffer = (property: Property) => {
    setSelectedProperty(property);
    setShowOfferModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-blue-500';
      case 'negotiation': return 'bg-yellow-500';
      case 'sold': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available': return 'Active Search';
      case 'negotiation': return 'Offer Submitted';
      case 'sold': return 'Acquired';
      case 'under-contract': return 'Under Contract';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-[var(--font-size)] text-[#030213]">
              Buy Cycle Management
            </h1>
            <p className="text-[#666] mt-1">
              Buyer Representation & Property Matching
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowRequirementForm(true)}
            className="bg-[#fb8500] hover:bg-[#fb8500]/90 text-white gap-2"
          >
            <Plus className="h-4 w-4" />
            New Buyer Requirement
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-[#e9ebef]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#666]">Total Requirements</p>
                <p className="text-[#030213] mt-1">{stats.totalRequirements}</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-[#fb8500]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#e9ebef]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#666]">Active Searches</p>
                <p className="text-[#030213] mt-1">{stats.activeSearches}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Search className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#e9ebef]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#666]">Offers Submitted</p>
                <p className="text-[#030213] mt-1">{stats.offersSubmitted}</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#e9ebef]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#666]">Acquired</p>
                <p className="text-[#030213] mt-1">{stats.acquired}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side - Requirements List */}
        <Card className="lg:col-span-1 border-[#e9ebef]">
          <CardHeader className="border-b border-[#e9ebef] bg-gradient-to-r from-orange-50 to-white">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#fb8500]" />
              Buyer Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#666]" />
              <Input
                placeholder="Search requirements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-[#e9ebef]"
              />
            </div>

            {/* Requirements List */}
            <ScrollArea className="h-[600px]">
              <div className="space-y-3">
                {filteredRequirements.length === 0 ? (
                  <div className="text-center py-12">
                    <Building className="h-12 w-12 text-[#ccc] mx-auto mb-3" />
                    <p className="text-[#666]">No buyer requirements yet</p>
                    <Button
                      onClick={() => setShowRequirementForm(true)}
                      variant="link"
                      className="text-[#fb8500] mt-2"
                    >
                      Create your first requirement
                    </Button>
                  </div>
                ) : (
                  filteredRequirements.map((req) => {
                    const buyer = contacts.find(c => c.id === req.currentOwnerId);
                    const offers = getOffersByRequirement(req.id);
                    const matchCount = getSmartMatches(req.id).length;

                    return (
                      <Card
                        key={req.id}
                        className={`cursor-pointer transition-all hover:shadow-md border-2 ${selectedRequirement?.id === req.id
                          ? 'border-[#fb8500] bg-orange-50'
                          : 'border-[#e9ebef]'
                          }`}
                        onClick={() => {
                          setSelectedRequirement(req);
                          setActiveTab('matching');
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="text-[#030213]">{req.title}</h3>
                              {buyer && (
                                <p className="text-[#666] text-sm mt-1">
                                  {buyer.name}
                                </p>
                              )}
                            </div>
                            <Badge className={`${getStatusColor(req.status)} text-white`}>
                              {getStatusLabel(req.status)}
                            </Badge>
                          </div>

                          {/* Budget Range */}
                          <div className="flex items-center gap-2 text-[#666] text-sm mb-2">
                            <TrendingUp className="h-4 w-4" />
                            <span>
                              {formatPKR(req.budgetMin || 0)} - {formatPKR(req.budgetMax || 0)}
                            </span>
                          </div>

                          {/* Preferred Locations */}
                          {req.preferredLocations && req.preferredLocations.length > 0 && (
                            <div className="flex items-start gap-2 text-[#666] text-sm mb-2">
                              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <div className="flex flex-wrap gap-1">
                                {req.preferredLocations.slice(0, 2).map((loc, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {loc}
                                  </Badge>
                                ))}
                                {req.preferredLocations.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{req.preferredLocations.length - 2} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Match Count & Offers */}
                          <div className="flex items-center justify-between text-sm mt-3 pt-3 border-t border-[#e9ebef]">
                            <span className="text-[#666]">
                              {matchCount} matches
                            </span>
                            {offers.length > 0 && (
                              <Badge variant="outline" className="text-[#fb8500]">
                                {offers.length} offers
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right Side - Details & Matching */}
        <Card className="lg:col-span-2 border-[#e9ebef]">
          <CardContent className="p-6">
            {!selectedRequirement ? (
              <div className="text-center py-16">
                <Search className="h-16 w-16 text-[#ccc] mx-auto mb-4" />
                <h3 className="text-[#030213] mb-2">Select a Buyer Requirement</h3>
                <p className="text-[#666]">
                  Choose a requirement from the list to view matching properties and manage offers
                </p>
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4 bg-[#ececf0]">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="matching">
                    Matching ({matches.length})
                  </TabsTrigger>
                  <TabsTrigger value="shortlist">
                    Shortlist ({selectedRequirement.shortlistedProperties?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="offers">
                    Offers ({getOffersByRequirement(selectedRequirement.id).length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="mt-6">
                  <RequirementDetails requirement={selectedRequirement} contacts={contacts} />
                </TabsContent>

                <TabsContent value="matching" className="mt-6">
                  <PropertyMatching
                    matches={matches}
                    requirement={selectedRequirement}
                    onShortlist={handleShortlist}
                    onViewingFeedback={handleViewingFeedback}
                    onDraftOffer={handleDraftOffer}
                  />
                </TabsContent>

                <TabsContent value="shortlist" className="mt-6">
                  <ShortlistView
                    requirement={selectedRequirement}
                    onRemoveShortlist={handleRemoveShortlist}
                    onViewingFeedback={handleViewingFeedback}
                    onDraftOffer={handleDraftOffer}
                  />
                </TabsContent>

                <TabsContent value="offers" className="mt-6">
                  <OffersView requirement={selectedRequirement} />
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      {showRequirementForm && (
        <RequirementFormModal
          user={user}
          contacts={contacts}
          onClose={() => {
            setShowRequirementForm(false);
            loadData();
          }}
        />
      )}

      {showViewingModal && selectedProperty && selectedRequirement && (
        <ViewingFeedbackModal
          property={selectedProperty}
          requirement={selectedRequirement}
          onClose={() => {
            setShowViewingModal(false);
            setSelectedProperty(null);
            loadData();
          }}
        />
      )}

      {showOfferModal && selectedProperty && selectedRequirement && (
        <BuyerOfferModal
          property={selectedProperty}
          requirement={selectedRequirement}
          user={user}
          contacts={contacts}
          onClose={() => {
            setShowOfferModal(false);
            setSelectedProperty(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}

// Subcomponents
function RequirementDetails({ requirement, contacts }: { requirement: Property; contacts: Contact[] }) {
  const buyer = contacts.find(c => c.id === requirement.currentOwnerId);

  return (
    <ScrollArea className="h-[500px]">
      <div className="space-y-6">
        <div>
          <h3 className="text-[#030213] mb-4">Buyer Information</h3>
          {buyer ? (
            <div className="bg-[#f8f9fa] p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <p className="text-[#666]">Name:</p>
                <p className="text-[#030213]">{buyer.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-[#666]">Phone:</p>
                <p className="text-[#030213]">{buyer.phone}</p>
              </div>
              {buyer.email && (
                <div className="flex items-center gap-2">
                  <p className="text-[#666]">Email:</p>
                  <p className="text-[#030213]">{buyer.email}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-[#666]">No buyer contact linked</p>
          )}
        </div>

        <div>
          <h3 className="text-[#030213] mb-4">Budget Range</h3>
          <div className="bg-[#f8f9fa] p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-[#666]">Minimum:</span>
              <span className="text-[#030213]">{formatPKR(requirement.budgetMin || 0)}</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[#666]">Maximum:</span>
              <span className="text-[#030213]">{formatPKR(requirement.budgetMax || 0)}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-[#030213] mb-4">Property Requirements</h3>
          <div className="bg-[#f8f9fa] p-4 rounded-lg space-y-2">
            {requirement.propertyType && (
              <div className="flex items-center justify-between">
                <span className="text-[#666]">Type:</span>
                <Badge variant="outline">{requirement.propertyType}</Badge>
              </div>
            )}
            {requirement.bedrooms && (
              <div className="flex items-center justify-between">
                <span className="text-[#666]">Bedrooms:</span>
                <span className="text-[#030213]">{requirement.bedrooms}</span>
              </div>
            )}
            {requirement.bathrooms && (
              <div className="flex items-center justify-between">
                <span className="text-[#666]">Bathrooms:</span>
                <span className="text-[#030213]">{requirement.bathrooms}</span>
              </div>
            )}
            {requirement.area && (
              <div className="flex items-center justify-between">
                <span className="text-[#666]">Area:</span>
                <span className="text-[#030213]">
                  {requirement.area} {requirement.areaUnit || 'sqft'}
                </span>
              </div>
            )}
          </div>
        </div>

        {requirement.preferredLocations && requirement.preferredLocations.length > 0 && (
          <div>
            <h3 className="text-[#030213] mb-4">Preferred Locations</h3>
            <div className="flex flex-wrap gap-2">
              {requirement.preferredLocations.map((loc, idx) => (
                <Badge key={idx} className="bg-[#fb8500] text-white">
                  {loc}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {requirement.description && (
          <div>
            <h3 className="text-[#030213] mb-4">Additional Notes</h3>
            <p className="text-[#666] whitespace-pre-wrap">{requirement.description}</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

function PropertyMatching({
  matches,
  requirement,
  onShortlist,
  onViewingFeedback,
  onDraftOffer
}: {
  matches: PropertyMatch[];
  requirement: Property;
  onShortlist: (propertyId: string) => void;
  onViewingFeedback: (property: Property) => void;
  onDraftOffer: (property: Property) => void;
}) {
  return (
    <ScrollArea className="h-[500px]">
      {matches.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-[#ccc] mx-auto mb-3" />
          <p className="text-[#666]">No matching properties found</p>
          <p className="text-[#666] text-sm mt-2">
            Try adjusting the budget range or preferred locations
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => (
            <PropertyMatchCard
              key={match.property.id}
              match={match}
              requirement={requirement}
              onShortlist={onShortlist}
              onViewingFeedback={onViewingFeedback}
              onDraftOffer={onDraftOffer}
            />
          ))}
        </div>
      )}
    </ScrollArea>
  );
}

function ShortlistView({
  requirement,
  onRemoveShortlist,
  onViewingFeedback,
  onDraftOffer
}: {
  requirement: Property;
  onRemoveShortlist: (propertyId: string) => void;
  onViewingFeedback: (property: Property) => void;
  onDraftOffer: (property: Property) => void;
}) {
  const shortlistedIds = requirement.shortlistedProperties || [];
  const properties = getProperties();
  const shortlistedProperties = shortlistedIds
    .map(id => properties.find(p => p.id === id))
    .filter((p): p is Property => p !== undefined);

  return (
    <ScrollArea className="h-[500px]">
      {shortlistedProperties.length === 0 ? (
        <div className="text-center py-12">
          <Star className="h-12 w-12 text-[#ccc] mx-auto mb-3" />
          <p className="text-[#666]">No properties shortlisted yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {shortlistedProperties.map((property) => {
            const feedback = requirement.viewingFeedback?.find(
              f => f.propertyId === property.id
            );

            return (
              <Card key={property.id} className="border-[#e9ebef]">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {property.images && property.images[0] && (
                      <img
                        src={property.images[0]}
                        alt={property.title}
                        className="w-32 h-24 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-[#030213]">{property.title}</h3>
                          <p className="text-[#666] text-sm mt-1">{property.address}</p>
                        </div>
                        <p className="text-[#030213]">{formatPKR(property.price)}</p>
                      </div>

                      {feedback && (
                        <div className="bg-blue-50 p-3 rounded-lg mb-3">
                          <p className="text-[#666] text-sm mb-1">Viewing Feedback:</p>
                          <p className="text-[#030213] text-sm">{feedback.feedback}</p>
                          {feedback.rating && (
                            <div className="flex items-center gap-1 mt-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 ${star <= feedback.rating!
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                    }`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onViewingFeedback(property)}
                          className="gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          {feedback ? 'Update' : 'Add'} Feedback
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => onDraftOffer(property)}
                          className="bg-[#fb8500] hover:bg-[#fb8500]/90 text-white gap-2"
                        >
                          <FileText className="h-4 w-4" />
                          Draft Offer
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onRemoveShortlist(property.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </ScrollArea>
  );
}

function OffersView({ requirement }: { requirement: Property }) {
  const [showCloseDealModal, setShowCloseDealModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [selectedOfferProperty, setSelectedOfferProperty] = useState<Property | null>(null);
  const [selectedBuyer, setSelectedBuyer] = useState<Contact | null>(null);

  const offers = getOffersByRequirement(requirement.id);
  const properties = getProperties();
  const contacts = getContacts();

  const handleCloseDeal = (offer: any) => {
    const property = properties.find(p => p.id === offer.propertyId);
    const buyer = contacts.find(c => c.id === offer.buyerContactId);

    setSelectedOffer(offer);
    setSelectedOfferProperty(property || null);
    setSelectedBuyer(buyer || null);
    setShowCloseDealModal(true);
  };

  return (
    <>
      <ScrollArea className="h-[500px]">
        {offers.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-[#ccc] mx-auto mb-3" />
            <p className="text-[#666]">No offers submitted yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {offers.map((offer) => {
              const property = properties.find(p => p.id === offer.propertyId);

              return (
                <Card key={offer.id} className="border-[#e9ebef]">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-[#030213]">{property?.title || 'Unknown Property'}</h3>
                        <p className="text-[#666] text-sm mt-1">
                          {property?.address || 'Address not available'}
                        </p>
                      </div>
                      <Badge className={
                        offer.status === 'accepted' ? 'bg-green-500 text-white' :
                          offer.status === 'rejected' ? 'bg-red-500 text-white' :
                            offer.status === 'submitted' ? 'bg-yellow-500 text-white' :
                              'bg-gray-500 text-white'
                      }>
                        {offer.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-[#666] text-sm">Offer Amount</p>
                        <p className="text-[#030213]">{formatPKR(offer.offerAmount)}</p>
                      </div>
                      <div>
                        <p className="text-[#666] text-sm">Token Amount</p>
                        <p className="text-[#030213]">{formatPKR(offer.tokenAmount)}</p>
                      </div>
                    </div>

                    {offer.conditions && (
                      <div className="bg-[#f8f9fa] p-3 rounded-lg mb-3">
                        <p className="text-[#666] text-sm mb-1">Conditions:</p>
                        <p className="text-[#030213] text-sm">{offer.conditions}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#e9ebef]">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {offer.dealSource === 'internal-match' ? 'Internal Match' : 'External Market'}
                        </Badge>
                        <span className="text-[#666] text-sm">
                          {new Date(offer.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Close Deal Button - Only show for drafted/submitted offers */}
                      {(offer.status === 'drafted' || offer.status === 'submitted') && (
                        <Button
                          size="sm"
                          onClick={() => handleCloseDeal(offer)}
                          className="bg-green-600 hover:bg-green-700 text-white gap-2"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Close Deal
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Close Deal Modal */}
      {showCloseDealModal && selectedOffer && selectedBuyer && (
        <CloseBuyerDealModal
          offer={selectedOffer}
          property={selectedOfferProperty}
          requirement={requirement}
          buyer={selectedBuyer}
          onClose={() => {
            setShowCloseDealModal(false);
            setSelectedOffer(null);
            setSelectedOfferProperty(null);
            setSelectedBuyer(null);
          }}
          onSuccess={() => {
            setShowCloseDealModal(false);
            setSelectedOffer(null);
            setSelectedOfferProperty(null);
            setSelectedBuyer(null);
            // Trigger parent reload
            window.location.reload();
          }}
        />
      )}
    </>
  );
}