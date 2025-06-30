import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { TomTomApiKeySettingsService } from '@proxy/tom-tom';
import { Subject, takeUntil } from 'rxjs';
import { CENTER_POSITION, MAP_ZOOM_LEVEL, MAPS_WEB_MIN_JS } from 'src/app/shared/constants';
import { DeliveryCoordinates } from 'src/app/shared/map-utils';

@Component({
  selector: 'app-delivery-control-create-route-map',
  templateUrl: './delivery-control-create-route-map.component.html',
  styleUrls: ['./delivery-control-create-route-map.component.scss'],
})
export class DeliveryControlCreateRouteMapComponent implements OnInit, OnDestroy {
  map: any;
  apiLoaded = false;
  markers: any[] = [];
  destroy$: Subject<void> = new Subject();
  private _deliveryCoordinates: DeliveryCoordinates[];

  @Input() set deliveryCoordinates(value: DeliveryCoordinates[]) {
    if (!value) return;
    this._deliveryCoordinates = value;
    this.renderPointsOnMap(this.deliveryCoordinates);
    this.flyToMostCoordinates(this._deliveryCoordinates);
  }

  constructor(private readonly tomTomApiKeyService: TomTomApiKeySettingsService) {}

  ngOnInit(): void {
    this.loadTomTomScripts();
  }

  loadTomTomScripts(): void {
    if (!this.apiLoaded) {
      this.loadScript(MAPS_WEB_MIN_JS)
        .then(() => {
          this.apiLoaded = true;
          this.initializeMap();
        })
        .catch(error => {
          console.error('Error loading TomTom scripts:', error);
        });
    }
  }

  loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.body.appendChild(script);
    });
  }

  initializeMap(): void {
    this.tomTomApiKeyService
      .getMapOptionsApiKey()
      .pipe(takeUntil(this.destroy$))
      .subscribe(setting => {
        const apiKey = setting.apiKey;
        this.map = (window as any).tt.map({
          key: apiKey,
          container: 'map',
          center: [CENTER_POSITION.lon, CENTER_POSITION.lat],
          zoom: MAP_ZOOM_LEVEL,
        });
        this.map.addControl(new (window as any).tt.FullscreenControl());
        this.map.addControl(new (window as any).tt.NavigationControl());

        if (this._deliveryCoordinates.length > 0) {
          this.renderPointsOnMap(this._deliveryCoordinates);
          this.flyToMostCoordinates(this._deliveryCoordinates);
        }
      });
  }

  renderPointsOnMap(
    coordinates: { latitude: string; longitude: string; displayOrder: number; mapPin: string }[],
  ): void {
    if (!this.map) {
      return;
    }

    this.markers.forEach(marker => marker.remove());
    this.markers = [];

    const sortedCoordinates = coordinates.sort((a, b) => a.displayOrder - b.displayOrder);

    sortedCoordinates.forEach(coord => {
      const markerElement = document.createElement('div');
      markerElement.style.width = '30px';
      markerElement.style.height = '30px';
      markerElement.style.backgroundColor = '#007ACC';
      markerElement.style.color = 'white';
      markerElement.style.display = 'flex';
      markerElement.style.justifyContent = 'center';
      markerElement.style.alignItems = 'center';
      markerElement.style.borderRadius = '50%';
      markerElement.style.fontSize = '14px';
      markerElement.innerText = coord.mapPin;

      const marker = new (window as any).tt.Marker({ element: markerElement })
        .setLngLat([parseFloat(coord.longitude), parseFloat(coord.latitude)])
        .addTo(this.map);

      this.markers.push(marker);
    });
  }

  flyToMostCoordinates(
    coordinates: { latitude: string; longitude: string; displayOrder: number; mapPin: string }[],
  ): void {
    if (coordinates.length === 0 || !this.map) {
      return;
    }

    const average = coordinates.reduce(
      (acc, coord) => {
        acc.latitude += parseFloat(coord.latitude);
        acc.longitude += parseFloat(coord.longitude);
        return acc;
      },
      { latitude: 0, longitude: 0 },
    );

    const center = {
      latitude: average.latitude / coordinates.length,
      longitude: average.longitude / coordinates.length,
    };

    this.map.flyTo({
      center: [center.longitude, center.latitude],
      zoom: MAP_ZOOM_LEVEL,
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
