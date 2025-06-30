import { Component } from '@angular/core';
import { ListService } from '@abp/ng.core';

@Component({
  selector: 'app-valuetype',
  templateUrl: './valuetype.component.html',
  styleUrl: './valuetype.component.scss',
  providers: [ListService],
})
export class ValuetypeComponent {}
