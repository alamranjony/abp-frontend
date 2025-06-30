import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { Shape } from '../shape.model';
import { DeliveryZoneCoordinateService, ZoneAreaSelector } from '@proxy/deliveries';
import { ToasterService } from '@abp/ng.theme.shared';
import {
  DRAWING_TOOLS_WEB_JS,
  DRAWING_TOOLS_WEB_SEARCHBOX,
  DRAWING_TOOLS_WEB_SERVICE,
  MAPS_WEB_MIN_JS,
} from 'src/app/shared/constants';
import { TomTomApiKeySettingsService } from '@proxy/tom-tom';

@Component({
  selector: 'app-add-zone-map',
  templateUrl: './add-zone-map.component.html',
  styleUrl: './add-zone-map.component.scss',
})
export class AddZoneMapComponent implements OnChanges, AfterViewInit {
  map: any;
  drawingTools: any;
  shapes: Shape[] = [];
  coordinates: { latitude: number; longitude: number; displayOrder: number }[] = [];
  isPolygonDrawn: boolean = false;
  drawingToolsLoaded: boolean = false;
  apiLoaded: boolean = false;

  @Input() deliveryZoneId: string;
  @Input() zoneSaved: EventEmitter<void>;
  @Input() drawOnMapEnabled: boolean;
  @Input() zoneCoordinates: { latitude: number; longitude: number; displayOrder: number }[] = [];
  @Input() selectedZoneAreaSelector: ZoneAreaSelector;
  @Output() coordinatesChange = new EventEmitter<
    { latitude: number; longitude: number; displayOrder: number }[]
  >();
  @Output() isDeletedProgrammatically = new EventEmitter<boolean>();
  apiKey: string;

  constructor(
    private deliveryZoneCoordinateService: DeliveryZoneCoordinateService,
    private toaster: ToasterService,
    private readonly tomTomApiKeyService: TomTomApiKeySettingsService,
  ) {}

  ngAfterViewInit(): void {
    this.loadTomTomScripts();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.coordinates = [];
    if (changes['drawOnMapEnabled'] && changes['drawOnMapEnabled'].previousValue != undefined) {
      this.initializeMap();
    }
    if (
      changes['deliveryZoneId'] &&
      this.deliveryZoneId &&
      this.selectedZoneAreaSelector !== ZoneAreaSelector.ZipCode
    ) {
      this.loadZoneCoordinates(this.deliveryZoneId);
    }
    if (changes['zoneCoordinates']) {
      this.drawPolygonOnMap(changes['zoneCoordinates'].currentValue);
    }
  }

  loadTomTomScripts(): void {
    if (!this.apiLoaded) {
      this.loadScript(MAPS_WEB_MIN_JS)
        .then(() => {
          this.apiLoaded = true;
          return this.loadScript(DRAWING_TOOLS_WEB_JS);
        })
        .then(() => {
          return this.loadScript(DRAWING_TOOLS_WEB_SERVICE);
        })
        .then(() => {
          this.drawingToolsLoaded = true;
          return this.loadScript(DRAWING_TOOLS_WEB_SEARCHBOX);
        })
        .then(() => {
          this.initializeMap();
        })
        .catch(error => {
          console.error('Error loading TomTom scripts:', error);
        });
    } else if (this.drawingToolsLoaded) {
      this.initializeMap();
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
    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    this.tomTomApiKeyService.getTomTomApiKey().subscribe(setting => {
      this.apiKey = setting.apiKey;
      this.map = (window as any).tt.map({
        key: this.apiKey,
        container: 'map',
        center: [19.45773, 51.76217],
        zoom: 12,
      });
      this.map.addControl(new (window as any).tt.FullscreenControl(), 'bottom-right');
      this.map.addControl(new (window as any).tt.NavigationControl(), 'bottom-right');

      this.initializeDrawingTools();
      this.addSearchBox();
      this.addGeolocationControl();
      this.loadCurrentLocation();

      this.map.once('load', () => {
        if (this.deliveryZoneId) {
          this.loadZoneCoordinates(this.deliveryZoneId);
        }
      });

      if (this.zoneSaved) {
        this.zoneSaved.subscribe(() => {
          this.reloadMap();
        });
      }
    });
  }

  private addGeolocationControl() {
    const geolocateControl = new (window as any).tt.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
      },
      trackUserLocation: true,
      showUserLocation: true,
    });

    this.map.addControl(geolocateControl, 'bottom-right');
  }

  private loadCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const currentLat = position.coords.latitude;
          const currentLon = position.coords.longitude;

          this.map.setCenter([currentLon, currentLat]);
          this.map.setZoom(10);

          const currentLocationMarker = new (window as any).tt.Marker({
            element: this.createCustomMarker(),
            anchor: 'center',
          })
            .setLngLat([currentLon, currentLat])
            .addTo(this.map);
        },
        () => {
          this.toaster.warn('::Map:FailedToLoadCurrentLocation');
        },
      );
    }
  }

  createCustomMarker(): HTMLElement {
    const marker = document.createElement('div');
    marker.style.width = '20px';
    marker.style.height = '20px';
    marker.style.backgroundColor = '#5bc0de';
    marker.style.borderRadius = '50%';
    marker.style.border = '3px solid white';
    marker.style.boxShadow = '0px 0px 10px #5bc0de';

    return marker;
  }

  initializeDrawingTools(): void {
    this.map.once('load', () => {
      this.drawingTools = new (window as any).tt.plugins.DrawingTools({
        ttMapsSdk: (window as any).tt,
        controls: {
          select: false,
          line: false,
          pen: this.drawOnMapEnabled,
          rectangle: false,
          ellipse: false,
        },
      });
      if (this.drawOnMapEnabled) this.map.addControl(this.drawingTools, 'top-left');
      this.addDrawingToolListeners();
    });
  }

  addDrawingToolListeners(): void {
    this.drawingTools.on('tomtom.drawingtools.created', (event: any) => {
      this.map.getCanvas().style.pointerEvents = 'none';
      this.addFeatures(event.data.features);
    });

    this.drawingTools.on('tomtom.drawingtools.deleted', (event: any) => {
      this.map.getCanvas().style.pointerEvents = 'auto';
      this.deleteFeatures(event.data.features);
    });

    this.drawingTools.on('tomtom.drawingtools.changed', (event: any) => {
      this.updateFeatures(event.data.features);
    });

    this.drawingTools.on('tomtom.drawingtools.dragged', (event: any) => {
      this.updateFeatures(event.data.features);
    });
  }

  reloadMap() {
    if (this.deliveryZoneId) {
      this.loadZoneCoordinates(this.deliveryZoneId);
    }
  }

  loadZoneCoordinates(zoneId: string): void {
    this.deliveryZoneCoordinateService
      .getCoordinatesByDeliveryZone(zoneId)
      .subscribe(coordinates => {
        this.coordinates = coordinates.map((coord, index) => ({
          latitude: coord.latitude,
          longitude: coord.longitude,
          displayOrder: index + 1,
        }));
        this.coordinatesChange.emit(this.coordinates);
        this.drawPolygonOnMap(this.coordinates);
      });
  }

  drawPolygonOnMap(coordinates: { latitude: number; longitude: number }[]): void {
    const polygonCoordinates = coordinates.map(coord => [coord.longitude, coord.latitude]);
    if (this.map?.isStyleLoaded()) {
      this.addPolygonToMap(polygonCoordinates);
    } else {
      this.map?.once('style.load', () => {
        this.addPolygonToMap(polygonCoordinates);
      });
    }
  }

  addPolygonToMap(polygonCoordinates: any[]): void {
    try {
      if (!polygonCoordinates.length) {
        this.toaster.warn('::CoordinateFoundWarning');
        this.deletePolygonProgrammatically();
        return;
      }

      polygonCoordinates.forEach(coord => {
        if (coord[1] < -90 || coord[1] > 90) {
          throw new Error('::InvalidLatValue');
        }
        if (coord[0] < -180 || coord[0] > 180) {
          throw new Error('::InvalidLonValue');
        }
      });

      this.removeExistingPolygonLayers();

      this.map.addSource('polygon-source', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [polygonCoordinates] },
        },
      });

      this.map.addLayer({
        id: 'polygon-layer',
        type: 'fill',
        source: 'polygon-source',
        paint: { 'fill-color': '#888888', 'fill-opacity': 0.4 },
      });

      this.map.addLayer({
        id: 'polygon-outline',
        type: 'line',
        source: 'polygon-source',
        paint: { 'line-color': '#000000', 'line-width': 2 },
      });

      const bounds = polygonCoordinates.reduce(
        (bounds, coord) => bounds.extend(coord),
        new (window as any).tt.LngLatBounds(polygonCoordinates[0], polygonCoordinates[0]),
      );

      this.map.fitBounds(bounds, { padding: 20 });
      this.isPolygonDrawn = true;
    } catch (error) {
      this.toaster.error(`${error.message}`);
    }
  }

  addSearchBox(): void {
    const searchBox = new (window as any).tt.plugins.SearchBox((window as any).tt.services, {
      searchOptions: {
        key: this.apiKey,
        language: 'en-US',
        limit: 5,
      },
      autocompleteOptions: {
        key: this.apiKey,
      },
    });

    const searchBoxElement = searchBox.getSearchBoxHTML();
    searchBoxElement.style.position = 'absolute';
    searchBoxElement.style.top = '40px';
    searchBoxElement.style.left = '10px';
    searchBoxElement.style.width = '97%';
    searchBoxElement.style.zIndex = '1000';

    document.getElementById('map')?.appendChild(searchBoxElement);

    searchBox.on('tomtom.searchbox.resultselected', (event: any) => {
      const { position } = event.data.result;
      this.map.flyTo({
        center: [position.lng, position.lat],
        zoom: 10,
      });
    });
  }

  private removeExistingPolygonLayers(): void {
    ['polygon-layer', 'polygon-outline'].forEach(layer => {
      if (this.map.getLayer(layer)) this.map.removeLayer(layer);
    });
    if (this.map.getSource('polygon-source')) this.map.removeSource('polygon-source');
  }

  deletePolygonProgrammatically(isDeleteCoordinates?: boolean): void {
    this.removeExistingPolygonLayers();
    this.shapes = [];
    this.coordinates = [];
    this.isPolygonDrawn = false;
    this.coordinatesChange.emit(this.coordinates);
    if (isDeleteCoordinates) {
      this.isDeletedProgrammatically.emit(true);
    }
  }

  addFeatures(features: any[]): void {
    features.forEach((feature: any) => {
      const coordinates = feature.geometry.coordinates[0];
      this.coordinates = coordinates.map((coord: any, index: number) => ({
        latitude: coord[1],
        longitude: coord[0],
        displayOrder: index + 1,
      }));
      this.coordinatesChange.emit(this.coordinates);
      this.shapes.push(new Shape(feature.id, coordinates));
    });
  }

  deleteFeatures(features: any[]): void {
    features.forEach((feature: any) => {
      this.shapes = this.shapes.filter(shape => shape.id !== feature.id);
      this.coordinates = [];
      this.coordinatesChange.emit(this.coordinates);
    });
  }

  updateFeatures(features: any[]): void {
    features.forEach((feature: any) => {
      const coordinates = feature.geometry.coordinates[0];
      this.coordinates = coordinates.map((coord: any, index: number) => ({
        latitude: coord[1],
        longitude: coord[0],
        displayOrder: index + 1,
      }));
      this.coordinatesChange.emit(this.coordinates);
      this.shapes.forEach(shape => {
        if (shape.id === feature.id) shape.update(coordinates);
      });
    });
  }

  generateMap() {
    if (this.coordinates) this.drawPolygonOnMap(this.coordinates);
  }
}
