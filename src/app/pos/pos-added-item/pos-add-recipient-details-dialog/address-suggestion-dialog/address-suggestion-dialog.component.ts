import { Component, Inject, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TomTomApiKeySettingsService } from '@proxy/tom-tom';
import { MAPS_WEB_MIN_JS } from 'src/app/shared/constants';

@Component({
  selector: 'app-address-suggestion-dialog',
  templateUrl: './address-suggestion-dialog.component.html',
  styleUrls: ['./address-suggestion-dialog.component.scss'],
})
export class AddressSuggestionDialogComponent implements AfterViewInit {
  @ViewChild('mapElement', { static: true }) mapElement!: ElementRef;
  map: any;

  constructor(
    public dialogRef: MatDialogRef<AddressSuggestionDialogComponent>,
    private readonly tomTomApiKeyService: TomTomApiKeySettingsService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    dialogRef.disableClose = true;
  }

  async ngAfterViewInit() {
    try {
      await this.loadTomTomLibrary();
      const apiKey = await this.getApiKey();
      this.initializeMap(apiKey);
      this.addMarkers(this.data.suggestions);
    } catch (err) {
      console.error('Error initializing map:', err);
    }
  }

  loadTomTomLibrary(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).tt) {
        resolve();
      } else {
        const script = document.createElement('script');
        script.src = MAPS_WEB_MIN_JS;
        script.onload = () => resolve();
        script.onerror = err => reject(err);
        document.head.appendChild(script);
      }
    });
  }

  getApiKey(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.tomTomApiKeyService.getTomTomApiKey().subscribe(
        setting => {
          if (setting?.apiKey) {
            resolve(setting.apiKey);
          } else {
            reject('API key is missing or invalid.');
          }
        },
        error => reject('Failed to load map settings: ' + error),
      );
    });
  }

  initializeMap(apiKey: string) {
    this.map = (window as any).tt.map({
      key: apiKey,
      container: this.mapElement.nativeElement,
      center: [0, 0],
      zoom: 2,
    });

    setTimeout(() => {
      this.map.resize();
    }, 300);
  }

  addMarkers(suggestions: any[]) {
    if (!this.map) {
      return;
    }

    suggestions.forEach((suggestion: any) => {
      const position = suggestion.position;
      const marker = new (window as any).tt.Marker()
        .setLngLat([position.lon, position.lat])
        .addTo(this.map);

      marker.getElement().addEventListener('click', () => {
        this.selectAddress(suggestion);
      });
    });

    if (suggestions.length > 0) {
      const firstPosition = suggestions[0].position;
      this.map.setCenter([firstPosition.lon, firstPosition.lat]);
      this.map.setZoom(12);
    }
  }

  selectAddress(suggestion: any) {
    const address = suggestion.address;
    const formFields = {
      address1: (address?.streetNumber ? address.streetNumber + ' ' : '') + address.streetName,
      city: address.municipality || '',
      zipCode: address.postalCode || '',
      stateProvince: address.countrySubdivisionName || '',
    };
    this.dialogRef.close(formFields);
  }

  skip() {
    this.dialogRef.close(null);
  }
}
