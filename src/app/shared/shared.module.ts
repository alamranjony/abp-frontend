import { CoreModule, ListService } from '@abp/ng.core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { NgModule } from '@angular/core';
import { ThemeSharedModule } from '@abp/ng.theme.shared';
import { NgxValidateCoreModule } from '@ngx-validate/core';
import { ExportComponent } from './components/export.component';
import { SearchComponent } from './components/search/search.component';
import { AngularMaterialModule } from './angular-material/angular-material.module';
import { ImportComponent } from './components/import/import.component';
import { ExportTemplateComponent } from './components/export-template.component';
import { CreditCardPaymentComponent } from './components/credit-card-payment/credit-card-payment.component';
import { CreditCardAmountComponent } from './components/credit-card-payment/credit-card-amount/credit-card-amount.component';
import { MultiSelectDropdownComponent } from './components/controls/multi-select-dropdown/multi-select-dropdown.component';
import { ReportFiltersComponent } from './components/report-filters/report-filters.component';
import { TimeFormatDirective } from './time-format.directive';
import { ClearZeroOnFocusDirective } from './clear-zero-on-focus.directive';
import { DropdownComponent } from './components/controls/dropdown/dropdown.component';
import { BarcodeScannerDirective } from './directives/barcode-scanner.directive';
import { EmptyTableMessageComponent } from './components/empty-table-message.component';

@NgModule({
  declarations: [
    ExportComponent,
    ImportComponent,
    ExportTemplateComponent,
    CreditCardPaymentComponent,
    CreditCardAmountComponent,
    MultiSelectDropdownComponent,
    ReportFiltersComponent,
    TimeFormatDirective,
    ClearZeroOnFocusDirective,
    DropdownComponent,
    BarcodeScannerDirective,
    EmptyTableMessageComponent,
  ],
  imports: [
    CoreModule,
    ThemeSharedModule,
    NgbDropdownModule,
    NgxValidateCoreModule,
    SearchComponent,
    AngularMaterialModule,
  ],
  exports: [
    CoreModule,
    ThemeSharedModule,
    NgbDropdownModule,
    NgxValidateCoreModule,
    ExportComponent,
    SearchComponent,
    AngularMaterialModule,
    ImportComponent,
    ExportTemplateComponent,
    CreditCardPaymentComponent,
    CreditCardAmountComponent,
    MultiSelectDropdownComponent,
    ReportFiltersComponent,
    TimeFormatDirective,
    ClearZeroOnFocusDirective,
    DropdownComponent,
    BarcodeScannerDirective,
    EmptyTableMessageComponent,
  ],
  providers: [ListService],
})
export class SharedModule {}
