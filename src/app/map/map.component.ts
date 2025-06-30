import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { DeliveryZoneCoordinateService } from '@proxy/deliveries';
import { ThemeSharedModule, ToasterService } from '@abp/ng.theme.shared';
import { Shape } from './shape.model';
import { CENTER_POSITION, DRAWING_TOOLS_WEB_JS, MAPS_WEB_MIN_JS } from '../shared/constants';
import { TomTomApiKeySettingsService } from '@proxy/tom-tom';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapComponent implements OnInit, OnChanges {
  map: any;
  drawingTools: any;
  shapes: Shape[] = [];
  coordinates: { latitude: number; longitude: number; displayOrder: number }[] = [];
  isPolygonDrawn = false;
  drawingToolsLoaded = false;

  @Input() deliveryZoneId: string;
  @Input() zoneSaved: EventEmitter<void>;
  @Output() coordinatesChange = new EventEmitter<
    { latitude: number; longitude: number; displayOrder: number }[]
  >();
  @Output() isDeletedProgrammatically = new EventEmitter<boolean>();
  apiLoaded = false;

  constructor(
    private deliveryZoneCoordinateService: DeliveryZoneCoordinateService,
    private toaster: ToasterService,
    private readonly tomTomApiKeyService: TomTomApiKeySettingsService,
  ) {}

  ngOnInit(): void {
    this.loadTomTomScripts();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['deliveryZoneId'] && this.deliveryZoneId) {
      this.loadZoneCoordinates(this.deliveryZoneId);
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
          this.drawingToolsLoaded = true;
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
    this.tomTomApiKeyService.getTomTomApiKey().subscribe(setting => {
      const apiKey = setting.apiKey;
      this.map = (window as any).tt.map({
        key: apiKey,
        container: 'map',
        center: [CENTER_POSITION.lat, CENTER_POSITION.lon],
        zoom: 12,
      });
      this.map.addControl(new (window as any).tt.FullscreenControl());
      this.map.addControl(new (window as any).tt.NavigationControl());

      this.initializeDrawingTools();

      this.map.once('load', () => {
        if (this.deliveryZoneId) {
          this.loadZoneCoordinates(this.deliveryZoneId); // Ensure map is ready before loading
        }
      });

      if (this.zoneSaved) {
        this.zoneSaved.subscribe(() => this.reloadMap());
      }
    });
  }

  initializeDrawingTools(): void {
    this.map.once('load', () => {
      this.drawingTools = new (window as any).tt.plugins.DrawingTools({
        ttMapsSdk: (window as any).tt,
        controls: {
          select: false,
          line: false,
          pen: true,
          rectangle: false,
          ellipse: false,
        },
      });
      this.map.addControl(this.drawingTools, 'top-left');
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

  reloadMap(): void {
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
    if (this.map.isStyleLoaded()) {
      this.addPolygonToMap(polygonCoordinates);
    } else {
      this.map?.once('style.load', () => {
        this.addPolygonToMap(polygonCoordinates);
      });
    }
  }

  addPolygonToMap(polygonCoordinates: any[]): void {
    if (!polygonCoordinates.length) {
      this.toaster.warn('::CoordinateFoundWarning');
      this.deletePolygonProgrammatically();
      return;
    }

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
    features.forEach(feature => {
      const coordinates = feature.geometry.coordinates[0];
      this.coordinates = coordinates.map((coord, index) => ({
        latitude: coord[1],
        longitude: coord[0],
        displayOrder: index + 1,
      }));
      this.coordinatesChange.emit(this.coordinates);
      this.shapes.push(new Shape(feature.id, coordinates));
    });
  }

  deleteFeatures(features: any[]): void {
    features.forEach(feature => {
      this.shapes = this.shapes.filter(shape => shape.id !== feature.id);
      this.coordinates = [];
      this.coordinatesChange.emit(this.coordinates);
    });
  }

  updateFeatures(features: any[]): void {
    features.forEach(feature => {
      const coordinates = feature.geometry.coordinates[0];
      this.coordinates = coordinates.map((coord, index) => ({
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
}
