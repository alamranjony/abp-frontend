import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { SharedDataService } from '../shared-data.service';
import { OrderSummary } from '../models/order-summary.model';

@Component({
  selector: 'app-pos-bill-summary',
  templateUrl: './pos-bill-summary.component.html',
  styleUrls: ['./pos-bill-summary.component.scss'],
})
export class PosBillSummaryComponent {
  onChange(event: number) {
    this.deliveryFeeTotal = parseFloat(event.toFixed(2));
  }
  BillingItems = [
    {
      shortCode: 'DaisySun',
      name: 'Sunshine Daisy Delight',
      taxExempt: false,
    },
    {
      shortCode: 'RoseVel',
      name: 'Velvet Red Rose',
      taxExempt: false,
    },
    {
      shortCode: 'TulipBliss',
      name: 'Tulip Garden Bliss',
      taxExempt: false,
    },
    {
      shortCode: 'LavenderD',
      name: 'Lavender Dreams',
      taxExempt: false,
    },
  ];

  removeAllTax = false;
  deliveryFeeTotal: number = 0;

  constructor(
    public dialogRef: MatDialogRef<PosBillSummaryComponent>,
    private sharedDataService: SharedDataService,
  ) {}

  ngOnInit(): void {
    this.sharedDataService.orderSummary.subscribe((x: OrderSummary) => {
      this.deliveryFeeTotal = parseFloat(x.deliveryFeeTotal.toFixed(2));
    });
  }

  // Function to toggle all tax checkboxes
  toggleAllTax() {
    this.BillingItems.forEach(item => {
      item.taxExempt = this.removeAllTax;
    });
  }

  // Function to check if all items are tax exempt
  updateRemoveAllTax() {
    this.removeAllTax = this.BillingItems.every(item => item.taxExempt);
  }

  updateBillSummary() {
    this.sharedDataService.updateDeliveryFeeManually(this.deliveryFeeTotal);
    this.dialogRef.close();
  }
}
