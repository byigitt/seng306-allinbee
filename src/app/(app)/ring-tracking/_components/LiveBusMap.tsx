"use client";

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L, { type LatLngExpression, type Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from "@/trpc/react";
import { Bus } from 'lucide-react'; // Using lucide-react Bus icon for now

// Default Leaflet icon fix
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/images/marker-icon-2x.png',
  iconUrl: '/leaflet/images/marker-icon.png',
  shadowUrl: '/leaflet/images/marker-shadow.png',
});

// const customBusIcon = new L.Icon({
//   iconUrl: '/icons/bus-marker.png', // Placeholder path, actual icon needed
//   iconSize: [32, 32],
//   iconAnchor: [16, 32],
//   popupAnchor: [0, -32],
//   // shadowUrl: '/icons/bus-marker-shadow.png', // Optional shadow
//   // shadowSize: [41, 41],
//   // shadowAnchor: [12, 41],
// });

// Fallback if custom icon fails to load - No longer primary, using mergeOptions above
// const defaultIcon = createDefaultIcon(); // This line is effectively replaced by mergeOptions

interface LiveBusMapProps {
  // Props if needed, e.g., initial center, zoom
}

const MapRecenter: React.FC<{center: LatLngExpression, zoom: number}> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
};

const LiveBusMap: React.FC<LiveBusMapProps> = () => {
  const { data: buses, isLoading, error } = api.ringTracking.getLiveBusLocations.useQuery(
    {}, // Pass an empty object for no specific route filter
    { 
      refetchInterval: 10000, // Refetch every 10 seconds
      // Consider placeholderData or initialData if you want to avoid map jumping on first load
    }
  );

  // Default campus center and zoom
  const mapCenter: LatLngExpression = [34.502725, -118.481686]; // Centered to show example California buses
  const mapZoom = 9; // Zoomed out to show example California buses

  if (isLoading && !buses) {
    return <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-muted text-muted-foreground">Loading map and bus data...</div>;
  }

  if (error) {
    return <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-destructive/10 text-destructive">Error loading bus data: {error.message}</div>;
  }

  const validBuses = buses?.filter(
    bus => bus.liveLatitude !== null && bus.liveLongitude !== null
  ) ?? [];

  return (
    <MapContainer center={mapCenter} zoom={mapZoom} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }} className="rounded-lg z-0">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {/* <MapRecenter center={mapCenter} zoom={mapZoom} /> --> May not be needed if center is static for now */}
      
      {validBuses.map(bus => {
        const lat = parseFloat(bus.liveLatitude as unknown as string); // Prisma Decimal comes as string
        const lng = parseFloat(bus.liveLongitude as unknown as string);
        
        if (isNaN(lat) || isNaN(lng)) return null; // Skip if coords are invalid

        const position: LatLngExpression = [lat, lng];
        const routeInfo = bus.drivesRoutes?.[0]?.route?.routeName ?? 'N/A';

        return (
          <Marker 
            key={bus.vehicleId} 
            position={position} 
            // icon={defaultIcon} // No longer needed, L.Icon.Default is now configured
          >
            <Popup>
              <b>Bus ID:</b> {bus.vehicleId}<br />
              <b>Route:</b> {routeInfo}<br />
              <b>Location:</b> {lat.toFixed(4)}, {lng.toFixed(4)}
            </Popup>
          </Marker>
        );
      })}
      {validBuses.length === 0 && !isLoading && (
         <div 
            style={{
                position: 'absolute', 
                top: '50%', 
                left: '50%', 
                transform: 'translate(-50%, -50%)',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                padding: '10px 20px',
                borderRadius: '5px',
                zIndex: 1000, // Ensure it's above map tiles
                textAlign: 'center'
            }}
        >
            No live bus data available currently.
        </div>
      )}
    </MapContainer>
  );
};

export default LiveBusMap; 