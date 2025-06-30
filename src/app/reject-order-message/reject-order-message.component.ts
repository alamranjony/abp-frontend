import { ToasterService } from '@abp/ng.theme.shared';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { OrderService } from '@proxy/orders';
import { WireServiceMessageService } from '@proxy/wire-services/wire-service-messages';
import { Subject } from 'rxjs';
import { SharedModule } from '../shared/shared.module';

@Component({
  selector: 'app-reject-order-message',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './reject-order-message.component.html',
  styleUrl: './reject-order-message.component.scss',
})
export class RejectOrderMessageComponent implements OnInit, OnDestroy {
  destroy$: Subject<void> = new Subject();
  rejectMessage: string = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { orderId: string },
    private orderService: OrderService,
    private toasterService: ToasterService,
    private dialogRef: MatDialogRef<RejectOrderMessageComponent>,
    private wireServiceMessageService: WireServiceMessageService,
  ) {}

  ngOnInit(): void {
    this.wireServiceMessageService
      .getWireServiceRejectMessage(this.data.orderId)
      .subscribe(message => {
        if (message) this.rejectMessage = message;
      });
  }

  onClose = (): void => this.dialogRef.close();

  rejectOrder() {
    this.orderService.updateOrderStatusToReject(this.data.orderId, this.rejectMessage).subscribe({
      next: () => this.toasterService.success('::Shop:OrderRejected'),
      error: () => this.toasterService.error('::WireService:RejectOrder'),
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
