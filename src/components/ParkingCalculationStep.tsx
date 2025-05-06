
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ParkingCalculationStepProps {
  parkingData: {
    occupancyType: string;
    buildingArea: string;
    calculatedSpaces: number;
    manualOverride: string;
  };
  onParkingDataChange: (field: string, value: any) => void;
  occupancyData: {
    primaryOccupancy: string;
    buildingArea: string;
  };
}

const ParkingCalculationStep: React.FC<ParkingCalculationStepProps> = ({
  parkingData,
  onParkingDataChange,
  occupancyData
}) => {
  const [parkingRates, setParkingRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentRate, setCurrentRate] = useState<number | null>(null);

  // Fetch parking rates from database when occupancy type changes
  useEffect(() => {
    const fetchParkingRates = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('parking_requirements')
          .select('*');
        
        if (error) {
          throw error;
        }
        
        if (data) {
          setParkingRates(data);
          
          // Find matching rate for current occupancy
          const matchingRate = data.find(
            rate => rate.use_type.toLowerCase().includes(
              occupancyData.primaryOccupancy.toLowerCase().substring(0, 2)
            )
          );
          
          if (matchingRate) {
            setCurrentRate(parseRateString(matchingRate.parking_requirement));
          } else {
            setCurrentRate(null);
          }
        }
      } catch (error) {
        console.error('Error fetching parking rates:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchParkingRates();
  }, [occupancyData.primaryOccupancy]);

  // Parse rate string to number (e.g., "1 per 300 sq ft" to 1/300)
  const parseRateString = (rateString: string): number | null => {
    try {
      const match = rateString.match(/(\d+)\s+per\s+(\d+)/i);
      if (match) {
        const [_, numerator, denominator] = match;
        return Number(numerator) / Number(denominator);
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  // Calculate parking spaces when data changes
  useEffect(() => {
    if (currentRate && occupancyData.buildingArea) {
      const buildingAreaNum = parseFloat(occupancyData.buildingArea);
      if (!isNaN(buildingAreaNum)) {
        const calculatedSpaces = Math.ceil(buildingAreaNum * currentRate);
        onParkingDataChange('calculatedSpaces', calculatedSpaces);
      }
    }
  }, [currentRate, occupancyData.buildingArea]);

  // Handle manual override of calculated spaces
  const handleManualOverride = (value: string) => {
    onParkingDataChange('manualOverride', value);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Parking Calculation</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="occupancy-type">Occupancy Type</Label>
                <Input
                  id="occupancy-type"
                  value={occupancyData.primaryOccupancy}
                  disabled
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="building-area">Building Area (sq ft)</Label>
                <Input
                  id="building-area"
                  value={occupancyData.buildingArea}
                  disabled
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="parking-rate">Parking Rate</Label>
                <Input
                  id="parking-rate"
                  value={currentRate ? `1 per ${Math.round(1/currentRate)} sq ft` : 'Not available'}
                  disabled
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="calculated-spaces" className="font-bold">Required Parking Spaces</Label>
                <Input
                  id="calculated-spaces"
                  value={parkingData.calculatedSpaces || 'Not calculated'}
                  disabled
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Manual Adjustments</h3>
              
              <div className="space-y-2">
                <Label htmlFor="manual-override">Override Required Spaces</Label>
                <Input
                  id="manual-override"
                  type="number"
                  value={parkingData.manualOverride}
                  onChange={(e) => handleManualOverride(e.target.value)}
                  placeholder="Enter number of spaces"
                />
              </div>
              
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Parking Note</AlertTitle>
                <AlertDescription>
                  Use manual override to account for special conditions, mixed-use reductions, or local code modifications.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ParkingCalculationStep;
