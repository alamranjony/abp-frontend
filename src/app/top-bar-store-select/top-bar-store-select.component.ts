import { Component, OnInit } from '@angular/core';
import { StoreLookupDto, StoreService } from '@proxy/stores';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ToasterService } from '@abp/ng.theme.shared';
import { StoreDataService } from '../store/store.data.service';
import { AngularMaterialModule } from '../shared/angular-material/angular-material.module';

@Component({
  selector: 'app-top-bar-store-select',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    AngularMaterialModule,
  ],
  templateUrl: './top-bar-store-select.component.html',
  styleUrl: './top-bar-store-select.component.scss',
})
export class TopBarStoreSelectComponent implements OnInit {
  selectedStore: FormControl = new FormControl(null);
  stores?: StoreLookupDto[] = [];

  constructor(
    private readonly storeService: StoreService,
    private readonly storeDataService: StoreDataService,

    private readonly toaster: ToasterService,
  ) {}

  ngOnInit(): void {
    this.storeService.getStoresForSelection().subscribe(response => {
      this.stores = response;
      const selected = this.stores.find(e => e.isSelected);
      if (selected) {
        this.selectedStore.setValue(selected.id);
        this.storeDataService.setCurrentStore(selected);
      }
    });
  }

  onStoreChange(event: MatSelectChange) {
    const storeId = event.value;
    this.storeService.changeCurrentStore(storeId).subscribe({
      next: () => {
        window.location.reload();
      },
      error: () => {
        this.toaster.error('Something went wrong while changing the store');
      },
    });
  }
}
