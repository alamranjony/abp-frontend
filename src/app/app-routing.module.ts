import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { heartlandScriptsResolver } from './services/heartland-scripts.service';
import { authGuard, permissionGuard } from '@abp/ng.core';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadChildren: () => import('./home/home.module').then(m => m.HomeModule),
  },
  {
    path: 'account',
    loadChildren: () => import('@abp/ng.account').then(m => m.AccountModule.forLazy()),
  },
  {
    path: 'identity',
    loadChildren: () =>
      import('./identity-role-extended/identity-role-extended.module').then(
        m => m.IdentityRoleExtendedModule,
      ),
  },
  {
    path: 'tenant-management',
    loadChildren: () =>
      import('@abp/ng.tenant-management').then(m => m.TenantManagementModule.forLazy()),
  },
  {
    path: 'setting-management',
    loadChildren: () =>
      import('@abp/ng.setting-management').then(m => m.SettingManagementModule.forLazy()),
  },
  {
    path: 'valuetypes',
    loadChildren: () => import('./valuetype/valuetype.module').then(m => m.ValuetypeModule),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.Values',
    },
  },

  {
    path: 'customers',
    loadChildren: () => import('./customers/customers.module').then(m => m.CustomersModule),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.Customers.View',
    },
  },
  {
    path: 'customerComments',
    loadChildren: () =>
      import('./customer-comment/customer-comment.module').then(m => m.CustomerCommentModule),
  },
  {
    path: 'emailDirectories',
    loadChildren: () =>
      import('./email-directory/email-directory.module').then(m => m.EmailDirectoryModule),
  },
  {
    path: 'phoneDirectories',
    loadChildren: () =>
      import('./phone-directory/phone-directory.module').then(m => m.PhoneDirectoryModule),
  },
  {
    path: 'corporateSettings',
    loadChildren: () =>
      import('./corporate-settings/corporate-settings.module').then(m => m.CorporateSettingsModule),
  },
  {
    path: 'stores',
    loadChildren: () => import('./store/store.module').then(m => m.StoreModule),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.Stores',
    },
  },
  {
    path: 'vehicles',
    loadChildren: () => import('./vehicle/vehicle.module').then(m => m.VehicleModule),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.Vehicles',
    },
  },
  {
    path: 'shops',
    loadChildren: () => import('./shop/shop.module').then(m => m.ShopModule),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.Shops',
    },
  },

  {
    path: 'credit-card-settings',
    loadChildren: () =>
      import('./credit-card-settings/credit-card-settings.module').then(
        m => m.CreditCardSettingsModule,
      ),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.CreditCardSettings',
    },
  },
  {
    path: 'valuetypesettings',
    loadChildren: () =>
      import('./value-type-settings/value-type-settings.module').then(
        m => m.ValueTypeSettingsModule,
      ),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.Values',
    },
  },
  {
    path: 'audit-logs',
    loadChildren: () => import('./audit-logs/audit-logs.module').then(m => m.AuditLogsModule),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.Logs.View',
    },
  },
  {
    path: 'error-logs',
    loadChildren: () => import('./error-logs/error-logs.module').then(m => m.ErrorLogsModule),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.Host',
    },
  },
  {
    path: 'giftCards',
    loadChildren: () => import('./gift-card/gift-card.module').then(m => m.GiftCardModule),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.GiftCards',
    },
  },
  {
    path: 'products',
    loadChildren: () => import('./products/products.module').then(m => m.ProductsModule),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.Products',
    },
  },
  {
    path: 'discounts',
    loadChildren: () => import('./discounts/discounts.module').then(m => m.DiscountsModule),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.Discounts',
    },
  },
  {
    path: 'shipping-service',
    loadChildren: () =>
      import('./shipping-service/shipping-service.module').then(m => m.ShippingServiceModule),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.ShippingServices',
    },
  },
  {
    path: 'delivery-zones',
    loadChildren: () =>
      import('./delivery-zone/delivery-zone.module').then(m => m.DeliveryZoneModule),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.DeliveryZones',
    },
  },
  {
    path: 'delivery-code',
    loadChildren: () =>
      import('./delivery-code/delivery-code.module').then(m => m.DeliveryCodeModule),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.DeliveryCodes',
    },
  },
  {
    path: 'deliverySlots',
    loadChildren: () =>
      import('./delivery-slot/delivery-slot.module').then(m => m.DeliverySlotModule),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.DeliveryZones',
    },
  },
  {
    path: 'deliveryModes',
    loadChildren: () =>
      import('./delivery-mode/delivery-mode.module').then(m => m.DeliveryModeModule),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.DeliveryModes',
    },
  },
  {
    path: 'deliveryMapOptionSettings',
    loadChildren: () =>
      import('./delivery-map-option-setting/delivery-map-option-setting.module').then(
        m => m.DeliveryMapOptionSettingModule,
      ),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.DeliveryMapOptionsSettings',
    },
  },
  {
    path: 'account-settings',
    loadChildren: () =>
      import('./account-settings/account-settings.module').then(m => m.AccountSettingsModule),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.AccountSettings',
    },
  },
  {
    path: 'forget-password',
    loadChildren: () =>
      import('./forget-password/forget-password.module').then(m => m.ForgetPasswordModule),
  },
  {
    path: 'employee-settings',
    loadChildren: () =>
      import('./employee-settings/employee-settings.module').then(m => m.EmployeeSettingsModule),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.EmployeeSettings',
    },
  },
  {
    path: 'employees',
    loadChildren: () => import('./employee/employee.module').then(m => m.EmployeeModule),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.Employees',
    },
  },
  {
    path: 'smstemplates',
    loadChildren: () => import('./sms-template/sms-template.module').then(m => m.SmsTemplateModule),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.SmsTemplates',
    },
  },
  {
    path: 'twilio-sms-settings',
    loadChildren: () =>
      import('./twilio-sms-settings/twilio-sms-settings.module').then(
        m => m.TwilioSmsSettingsModule,
      ),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.TwilioSmsSettings',
    },
  },
  {
    path: 'pos',
    loadChildren: () => import('./pos/pos.module').then(m => m.POSModule),
    resolve: { heartlandScripts: heartlandScriptsResolver },
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.Orders',
    },
  },
  {
    path: 'tenant-email-settings',
    loadChildren: () =>
      import('./tenant-email-settings/tenant-email-settings.module').then(
        m => m.TenantEmailSettingsModule,
      ),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.TenantEmailSettings',
    },
  },
  {
    path: 'transaction-type-settings',
    loadChildren: () =>
      import('./transaction-type-settings/transaction-type-settings.module').then(
        m => m.TransactionTypeSettingsModule,
      ),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.PaymentTransactionCodes',
    },
  },
  {
    path: 'queued-emails',
    loadChildren: () =>
      import('./queued-emails/queued-emails.module').then(m => m.QueuedEmailsModule),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.QueuedEmails',
    },
  },
  {
    path: 'scheduler-settings',
    loadChildren: () =>
      import('./scheduler-settings/scheduler-settings.module').then(m => m.SchedulerSettingsModule),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.SchedulerSettings',
    },
  },
  {
    path: 'calendar',
    loadChildren: () => import('./calendar/calendar.module').then(m => m.CalendarModule),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.DeliveryModeDateMap',
    },
  },
  {
    path: 'messageShortcuts',
    loadChildren: () =>
      import('./message-shortcut/message-shortcut.module').then(m => m.MessageShortcutModule),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.MessageShortcuts',
    },
  },
  {
    path: 'time-clocks',
    loadChildren: () => import('./time-clock/time-clock.module').then(m => m.TimeClockModule),
    canActivate: [authGuard, permissionGuard],
  },
  {
    path: 'sms-histories',
    loadChildren: () => import('./sms-history/sms-history.module').then(m => m.SmsHistoryModule),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.SmsHistories',
    },
  },
  {
    path: 'payroll',
    loadChildren: () => import('./payroll/payroll.module').then(m => m.PayrollModule),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.Payrolls',
    },
  },
  {
    path: 'message-templates',
    loadChildren: () =>
      import('./message-template/message-template.module').then(m => m.MessageTemplateModule),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.MessageTemplates',
    },
  },
  {
    path: 'delivery-charge-adjustment',
    loadChildren: () =>
      import(
        './delivery-charge-adjustment-settings/delivery-charge-adjustment-settings.module'
      ).then(m => m.DeliveryChargeAdjustmentSettingsModule),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.DeliveryChargeAdjustmentSettings',
    },
  },
  {
    path: 'sales-commissions',
    loadChildren: () =>
      import('./sales-commissions/sales-commissions.module').then(m => m.SalesCommissionsModule),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.Commissions',
    },
  },
  {
    path: 'wire-service-shops',
    loadChildren: () =>
      import('./wire-service-shop/wire-service-shop.module').then(m => m.WireServiceShopModule),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.WireServiceShops',
    },
  },
  {
    path: 'delivery-short-code',
    loadChildren: () =>
      import('./delivery-short-code/delivery-short-code.module').then(
        m => m.DeliveryShortCodeModule,
      ),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.DeliveryShortCodes',
    },
  },
  {
    path: 'order-control-list',
    loadChildren: () =>
      import('./order-control-list/order-control-list.module').then(m => m.OrderControlListModule),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.Orders',
    },
  },
  {
    path: 'store-credit-card-setup',
    loadChildren: () =>
      import('./store-credit-card-setup/store-credit-card-setup.module').then(
        m => m.StoreCreditCardSetupModule,
      ),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.StoreSpecificCreditCardSetups',
    },
  },
  {
    path: 'wire-service-setup',
    loadChildren: () =>
      import('./wire-service-setup/wire-service-setup.module').then(m => m.WireServiceSetupModule),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.WireServiceSetup',
    },
  },
  {
    path: 'store-wire-service-allocation',
    loadChildren: () =>
      import('./store-wire-service-allocation/store-wire-service-allocation.module').then(
        m => m.StoreWireServiceAllocationModule,
      ),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.StoreSpecificWireServiceAllocationSettings',
    },
  },
  {
    path: 'individual-house-account-payment',
    loadChildren: () =>
      import('./individual-payment/individual-payment.module').then(m => m.IndividualPaymentModule),
    resolve: { heartlandScripts: heartlandScriptsResolver },
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.SinglePayment',
    },
  },
  {
    path: 'deliveryManagement',
    loadChildren: () =>
      import('./delivery-management/delivery-management.module').then(
        m => m.DeliveryManagementModule,
      ),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.DeliveryManagement',
    },
  },
  {
    path: 'batch-house-account-payment',
    loadChildren: () =>
      import(
        './account-receivable/batch-house-account-payment/batch-house-account-payment.module'
      ).then(m => m.BatchHouseAccountPaymentModule),
    resolve: { heartlandScripts: heartlandScriptsResolver },
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.BatchDetails',
    },
  },
  {
    path: 'terms-code-configuration',
    loadChildren: () =>
      import('./account-receivable/terms-code/terms-code.module').then(m => m.TermsCodeModule),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.TermsCode',
    },
  },
  {
    path: 'order-report',
    loadChildren: () =>
      import('./order-reports/order-report.module').then(m => m.OrderReportModule),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.Reports.OrderRequirementsListReport',
    },
  },
  {
    path: 'product-ranking-report',
    loadChildren: () =>
      import('./reports/product-ranking/product-ranking-report.module').then(
        m => m.ProductRankingReportModule,
      ),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.Reports.ProductSalesAnalysisReport',
    },
  },
  {
    path: 'customer-product-analysis-report',
    loadChildren: () =>
      import('./reports/customer-product-analysis/customer-product-analysis-report.module').then(
        m => m.CustomerProductAnalysisReportModule,
      ),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.Reports.ProductSalesAnalysisReport',
    },
  },
  {
    path: 'store-sales-analysis-report',
    loadChildren: () =>
      import('./reports/store-sales-analysis/store-sales-analysis-report.module').then(
        m => m.StoreSalesAnalysisReportModule,
      ),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.Reports.ProductSalesAnalysisReport',
    },
  },
  {
    path: 'time-card-summary-report',
    loadChildren: () =>
      import('./reports/time-card-summary-report/time-card-summary-report.module').then(
        m => m.TimeCardSummaryReportModule,
      ),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.Reports.TimeClockReportingAndSummaryReport',
    },
  },
  {
    path: 'product-sales-comparisons-report',
    loadChildren: () =>
      import('./reports/product-sales-comparisons/product-sales-comparisons-report.module').then(
        m => m.ProductSalesComparisonsReportModule,
      ),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.Reports.SalesComparisonByDateRangeReport',
    },
  },
  {
    path: 'sales-rep-productivity-summary-report',
    loadChildren: () =>
      import(
        './reports/sales-rep-productivity-summary-report/sales-rep-productivity-summary-report.module'
      ).then(m => m.SalesRepProductivitySummaryReportModule),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.Reports.EmployeeProductivityReport',
    },
  },
  {
    path: 'sales-rep-productivity-detail-report',
    loadChildren: () =>
      import(
        './reports/sales-rep-productivity-detail-report/sales-rep-productivity-detail-report.module'
      ).then(m => m.SalesRepProductivityDetailReportModule),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.Reports.EmployeeProductivityReport',
    },
  },
  {
    path: 'driverActivities',
    loadChildren: () =>
      import('./driver-activity/driver-activity.module').then(m => m.DriverActivityModule),
    canActivate: [authGuard, permissionGuard],
  },
  {
    path: 'product-sales-by-order-placement-report',
    loadChildren: () =>
      import(
        './reports/product-sales-by-order-placement/product-sales-by-order-placement-report.module'
      ).then(m => m.ProductSalesByOrderPlacementReportModule),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.Reports.ProductSalesAnalysisReport',
    },
  },
  {
    path: 'product-type-comparisons-report',
    loadChildren: () =>
      import('./reports/product-type-comparisons/product-type-comparisons-report.module').then(
        m => m.ProductTypeComparisonsReportModule,
      ),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.Reports.ProductSalesAnalysisReport',
    },
  },
  {
    path: 'customer-sale-performance-report',
    loadChildren: () =>
      import(
        './reports/customer-sale-performance-report/customer-sale-performance-report.module'
      ).then(m => m.CustomerSalePerformanceReportModule),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.Reports.ProductSalesAnalysisReport',
    },
  },
  {
    path: 'product-sales-comparisons-by-sales-person-report',
    loadChildren: () =>
      import(
        './reports/product-sales-comparisons-by-sales-person/product-sales-comparisons-by-sales-person-report.module'
      ).then(m => m.ProductSalesComparisonsBySalesPersonReportModule),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.Reports.ProductSalesAnalysisReport',
    },
  },
  {
    path: 'product-sales-comparison-by-customers-report',
    loadChildren: () =>
      import(
        './reports/product-sales-comparison-by-customers/product-sales-comparison-by-customers-report.module'
      ).then(m => m.ProductSalesComparisonByCustomerReportModule),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.Reports.ProductSalesAnalysisReport',
    },
  },
  {
    path: 'product-sales-by-delivery-type-report',
    loadChildren: () =>
      import(
        './reports/product-sales-by-delivery-type/product-sales-by-delivery-type-report.module'
      ).then(m => m.ProductSalesByDeliveryTypeReportModule),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.Reports.ProductSalesAnalysisReport',
    },
  },
  {
    path: 'sales-variance-by-sales-rep-report',
    loadChildren: () =>
      import(
        './reports/sales-variance-by-sales-rep-report/sales-variance-by-sales-rep-report.module'
      ).then(m => m.SalesVarianceBySalesRepReportModule),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.Reports.ProductSalesAnalysisReport',
    },
  },
  {
    path: 'creditAndReplacementReport',
    loadChildren: () =>
      import('./reports/credit-and-replacement-report/credit-and-replacement-report.module').then(
        m => m.CreditAndReplacementReportModule,
      ),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.Reports.CancellationCreditAndReplacementsReport',
    },
  },
  {
    path: 'cancelledOrdersReport',
    loadChildren: () =>
      import('./reports/cancelled-orders-report/cancelled-orders-report.module').then(
        m => m.CancelledOrdersReportModule,
      ),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.Reports.CancellationCreditAndReplacementsReport',
    },
  },
  {
    path: 'salesman-gross-margin-analysis-report',
    loadChildren: () =>
      import(
        './reports/salesman-gross-margin-analysis/salesman-gross-margin-analysis-report.module'
      ).then(m => m.SalesmanGrossMarginAnalysisReportModule),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.Reports.ProductSalesAnalysisReport',
    },
  },
  {
    path: 'product-sales-comparisons-by-occasion-report',
    loadChildren: () =>
      import(
        './reports/product-sales-comparisons-by-occasions/product-sales-comparisons-by-occasion-report.module'
      ).then(m => m.ProductSalesComparisonsByOccasionReportModule),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.Reports.ProductSalesAnalysisReport',
    },
  },
  {
    path: 'discount-granted-analysis-report',
    loadChildren: () =>
      import(
        './reports/discount-granted-analysis-report/discount-granted-analysis-report.module'
      ).then(m => m.DiscountGrantedAnalysisReportModule),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.Reports.ProductSalesAnalysisReport',
    },
  },
  {
    path: 'order-master-list-report',
    loadChildren: () =>
      import('./reports/order-master-list-report/order-master-list-report.module').then(
        m => m.OrderMasterListReportModule,
      ),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.Reports.OrderMasterListReport',
    },
  },
  {
    path: 'payperiod-summary-report',
    loadChildren: () =>
      import('./reports/payperiod-summary-report/payperiod-summary-report.module').then(
        m => m.PayperiodSummaryReportModule,
      ),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.Reports.TimeClockReportingAndSummaryReport',
    },
  },
  {
    path: 'wire-service-message',
    loadChildren: () =>
      import('./wire-service-message/wire-service-message.module').then(
        m => m.WireServiceMessageModule,
      ),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.WireServiceMessage',
    },
  },
  {
    path: 'locked-orders',
    loadChildren: () =>
      import('./locked-order-list/locked-order-list.module').then(m => m.LockedOrderListModule),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.Orders.LockedOrder',
    },
  },
  {
    path: 'misc-order-list',
    loadChildren: () => import('./misc-orders/misc-orders.module').then(m => m.MiscOrdersModule),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.Orders.MiscOrder',
    },
  },
  {
    path: 'driver-summary',
    loadChildren: () =>
      import('./reports/driver-summary/driver-summary.module').then(m => m.DriverSummaryModule),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.Reports.EmployeeProductivityReport',
    },
  },
  {
    path: 'sales-analysis-by-sales-reps-report',
    loadChildren: () =>
      import(
        './reports/sales-analysis-by-sales-reps-report/sales-analysis-by-sales-reps-report.module'
      ).then(m => m.SalesAnalysisBySalesRepsReportModule),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.Reports.ProductSalesAnalysisReport',
    },
  },
  {
    path: 'printer-setup',
    loadChildren: () =>
      import('./printer-setup/printer-setup.module').then(m => m.PrinterSetupModule),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.Printing',
    },
  },
  {
    path: 'checkout-box',
    loadChildren: () => import('./checkout-box/checkout-box.module').then(m => m.CheckoutBoxModule),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.CheckoutBox',
    },
  },
  {
    path: 'business-analysis-report',
    loadChildren: () =>
      import('./reports/business-analysis-report/business-analysis-report.module').then(
        m => m.BusinessAnalysisReportModule,
      ),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.Reports.BusinessAnalysisReport',
    },
  },
  {
    path: 'designer-order-list',
    loadChildren: () =>
      import('./designer-order-control/designer-order-control-list.module').then(
        m => m.DesignerOrderControlListModule,
      ),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.Design',
    },
  },
  {
    path: 'card-design-setting',
    loadChildren: () =>
      import('./card-design-setting/card-design-setting.module').then(
        m => m.CardDesignSettingModule,
      ),
  },
  {
    path: 'invoice-report',
    loadChildren: () =>
      import('./invoice-report/invoice-report.module').then(m => m.InvoiceReportModule),
    canActivate: [authGuard, permissionGuard],
    data: {
      requiredPolicy: 'ClientPortal.InvoiceReports',
    },
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {})],
  exports: [RouterModule],
})
export class AppRoutingModule {}
