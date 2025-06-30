import { Component, OnInit } from '@angular/core';
import { ListService, PagedResultDto } from '@abp/ng.core';
import { CustomerCommentService, CustomerCommentDto } from '@proxy/customer-comments';
import { ConfirmationService, Confirmation, ToasterService } from '@abp/ng.theme.shared';
import { MatDialog } from '@angular/material/dialog';
import { CustomerCommentDialogComponent } from './customer-comment-dialog/customer-comment-dialog.component';
import { Sort } from '@angular/material/sort';
import { PageEvent } from '@angular/material/paginator';
import { ActivatedRoute } from '@angular/router';
import { DialogUtilService } from '../shared/dialog-util.service';

@Component({
  selector: 'app-customer-comment',
  templateUrl: './customer-comment.component.html',
  styleUrl: './customer-comment.component.scss',
  providers: [ListService],
})
export class CustomerCommentComponent implements OnInit {
  comments = { items: [], totalCount: 0 } as PagedResultDto<CustomerCommentDto>;
  columns: string[] = ['comment', 'commentAsLocationNote', 'actions'];
  customerId: string;

  constructor(
    public readonly list: ListService,
    private readonly customerCommentService: CustomerCommentService,
    private readonly confirmation: ConfirmationService,
    private readonly dialog: MatDialog,
    private readonly toasterService: ToasterService,
    private readonly route: ActivatedRoute,
    private readonly dialogUtil: DialogUtilService,
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.customerId = params.get('id') || '';
      if (this.customerId) {
        this.loadComments(this.customerId);
      }
    });
  }

  loadComments(customerId: string) {
    this.customerCommentService.getCustomerCommentsList(customerId).subscribe(response => {
      this.comments = response;
    });
  }

  handleServiceResponse(successMessage: string, errorMessage: string) {
    return {
      next: () => {
        this.toasterService.success(successMessage);
        this.loadComments(this.customerId);
      },
      error: () => this.toasterService.error(errorMessage),
    };
  }

  openCustomerCommentDialog(data: any, onSave: (result: any) => void) {
    const dialogRef = this.dialogUtil.openDialog(CustomerCommentDialogComponent, data);
    dialogRef.afterClosed().subscribe(result => {
      if (!result) {
        return;
      }
      onSave(result);
    });
  }

  createComment() {
    this.openCustomerCommentDialog({ isEditMode: false, customerId: this.customerId }, result => {
      this.customerCommentService
        .create(result)
        .subscribe(
          this.handleServiceResponse('::CustomerComment.Added', '::CustomerComment.Error'),
        );
    });
  }

  editComment(id: string) {
    this.customerCommentService.get(id).subscribe(result => {
      if (!result) {
        return;
      }

      this.openCustomerCommentDialog({ ...result, isEditMode: true }, updatedResult => {
        this.customerCommentService
          .update(id, updatedResult)
          .subscribe(
            this.handleServiceResponse('::CustomerComment.Updated', '::CustomerComment.Error'),
          );
      });
    });
  }

  delete(id: string) {
    this.confirmation.warn('::AreYouSureToDelete', '::AreYouSure').subscribe(status => {
      if (status !== Confirmation.Status.confirm) {
        return;
      }

      this.customerCommentService
        .delete(id)
        .subscribe(
          this.handleServiceResponse('::CustomerComment.Deleted', '::CustomerComment.Error'),
        );
    });
  }

  changeSort(sort: Sort) {
    this.list.sortKey = sort.active;
    this.list.sortOrder = sort.direction;
  }

  changePage(event: PageEvent) {
    this.list.page = event.pageIndex;
  }
}
