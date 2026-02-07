import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Property, User } from '../types';
import { getRelistableProperties, getCurrentOwner } from '../lib/ownership';
import { formatPKR } from '../lib/currency';
import { formatPropertyAddress } from '../lib/utils';
import { ArrowLeft, User as UserIcon, Calendar, MapPin, DollarSign } from 'lucide-react';

interface RelistablePropertiesWidgetProps {
  user: User;
  onViewProperty?: (property: Property) => void;
  onRelistProperty?: (property: Property) => void;
}

export const RelistablePropertiesWidget: React.FC<RelistablePropertiesWidgetProps> = ({
  user,
  onViewProperty,
  onRelistProperty
}) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProperties();
  }, [user.id]);

  const loadProperties = () => {
    try {
      const relistable = getRelistableProperties(user.id, user.role);
      setProperties(relistable);
    } catch (error) {
      console.error('Error loading relistable properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeft className="h-5 w-5" />
            Re-listable Properties
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ArrowLeft className="h-5 w-5" />
            Re-listable Properties
          </CardTitle>
          <Badge variant="secondary">{properties.length}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Sold properties that can be bought back into inventory
        </p>
      </CardHeader>
      <CardContent>
        {properties.length === 0 ? (
          <div className="text-center py-8">
            <ArrowLeft className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              No properties available for re-listing
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {properties.map((property) => {
                const owner = getCurrentOwner(property.id);
                
                return (
                  <div
                    key={property.id}
                    className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="space-y-3">
                      {/* Property Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{property.title}</h4>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{formatPropertyAddress(property.address)}</span>
                          </p>
                        </div>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 flex-shrink-0">
                          Sold
                        </Badge>
                      </div>

                      {/* Current Owner */}
                      {owner && (
                        <div className="flex items-center gap-2 text-sm">
                          <UserIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Owned by <span className="font-medium text-foreground">{owner.contactName}</span>
                          </span>
                        </div>
                      )}

                      {/* Financial Info */}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {property.finalSalePrice && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">Last Sale:</span>
                            <span className="font-medium">{formatPKR(property.finalSalePrice)}</span>
                          </div>
                        )}
                        {property.soldDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">Sold:</span>
                            <span className="font-medium">{formatDate(property.soldDate)}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        {onViewProperty && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onViewProperty(property)}
                            className="flex-1"
                          >
                            View Details
                          </Button>
                        )}
                        {onRelistProperty && (
                          <Button
                            size="sm"
                            onClick={() => onRelistProperty(property)}
                            className="flex-1 gap-1"
                          >
                            <ArrowLeft className="h-3 w-3" />
                            Re-List
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};