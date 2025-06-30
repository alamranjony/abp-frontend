import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CustomerSubOrderOrderHistoryDto, CustomerService } from '@proxy/customers';
import { MatTableDataSource } from '@angular/material/table';
import { SharedModule } from 'src/app/shared/shared.module';
import { BackButtonComponent } from '../../shared/components/back-button/back-button.component';

export class Group {
  level = 0;
  parent: Group;
  expanded = false;
  totalCounts = 0;
  get visible(): boolean {
    return !this.parent || (this.parent.visible && this.parent.expanded);
  }
}

@Component({
  standalone: true,
  imports: [SharedModule, BackButtonComponent],
  selector: 'app-customer-order-history',
  templateUrl: './customer-order-history.component.html',
  styleUrl: './customer-order-history.component.scss',
})
export class CustomerOrderHistoryComponent implements OnInit {
  customerId: string;
  customerSubOrderHistoryList: CustomerSubOrderOrderHistoryDto[];
  dataSourceItems = new MatTableDataSource<CustomerSubOrderOrderHistoryDto | Group>([]);
  displayedColumns: string[] = [
    'subOrder',
    'deliveryDate',
    'orderType',
    'recipient',
    'deliveryLocation',
    'orderDetails',
    'orderStatus',
    'deliveryType',
    'deliveryStatus',
    'deliveredDate',
  ];
  groupByColumns: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private readonly customerService: CustomerService,
  ) {
    this.groupByColumns = ['orderNumber'];
  }

  ngOnInit(): void {
    this.loadCustomerOrderHistory(this.route.snapshot.params['id']);
  }

  private loadCustomerOrderHistory(id: string) {
    this.customerService.getCustomerOrderHistoryDetailsByCustomerId(id).subscribe(response => {
      this.customerSubOrderHistoryList = response;
      this.dataSourceItems.data = this.addGroups(
        this.customerSubOrderHistoryList,
        this.groupByColumns,
      );
      this.assignSequenceNumbers(this.dataSourceItems.data);
      this.dataSourceItems.filterPredicate = this.customFilterPredicate.bind(this);
      this.dataSourceItems.filter = performance.now().toString();
    });
  }

  private customFilterPredicate(
    data: CustomerSubOrderOrderHistoryDto | Group,
    filter: string,
  ): boolean {
    return data instanceof Group ? data.visible : this.getDataRowVisible(data);
  }

  private getDataRowVisible(data: CustomerSubOrderOrderHistoryDto): boolean {
    const groupRows = this.dataSourceItems.data.filter(row => {
      if (!(row instanceof Group)) return false;
      let match = true;
      this.groupByColumns.forEach(column => {
        if (!row[column] || !data[column] || row[column] !== data[column]) match = false;
      });
      return match;
    });

    if (groupRows.length === 0) return true;

    const parent = groupRows[0] as Group;
    return parent.visible && parent.expanded;
  }

  groupHeaderClick(row) {
    row.expanded = !row.expanded;
    this.dataSourceItems.filter = performance.now().toString();
  }

  private addGroups(
    data: CustomerSubOrderOrderHistoryDto[],
    groupByColumns: string[],
  ): CustomerSubOrderOrderHistoryDto[] {
    const rootGroup = new Group();
    rootGroup.expanded = true;
    return this.getSublevel(data, 0, groupByColumns, rootGroup);
  }

  private getSublevel(
    data: CustomerSubOrderOrderHistoryDto[],
    level: number,
    groupByColumns: string[],
    parent: Group,
  ): CustomerSubOrderOrderHistoryDto[] {
    if (level >= groupByColumns.length) return data;

    const groups = this.uniqueBy(
      data.map(row => {
        const result = new Group();
        result.level = level + 1;
        result.parent = parent;
        for (let i = 0; i <= level; i++) result[groupByColumns[i]] = row[groupByColumns[i]];
        return result;
      }),
      JSON.stringify,
    );

    const currentColumn = groupByColumns[level];
    let subGroups = [];
    groups.forEach(group => {
      const rowsInGroup = data.filter(row => group[currentColumn] === row[currentColumn]);
      group.totalCounts = rowsInGroup.length;
      const subGroup = this.getSublevel(rowsInGroup, level + 1, groupByColumns, group);
      subGroup.unshift(group);
      subGroups = subGroups.concat(subGroup);
    });
    return subGroups;
  }

  private uniqueBy(a, key) {
    const seen = {};
    return a.filter(item => {
      const k = key(item);
      return seen.hasOwnProperty(k) ? false : (seen[k] = true);
    });
  }

  isGroup(index, item): boolean {
    return item.level;
  }

  private assignSequenceNumbers(data: (CustomerSubOrderOrderHistoryDto | Group)[]): void {
    let sequenceCounter = 1;
    data.forEach(item => {
      if (item instanceof Group) sequenceCounter = 1;
      else (item as any).sequenceNumber = sequenceCounter++;
    });
  }
}
