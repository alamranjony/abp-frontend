import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PosProductDetailsComponent } from '../pos-product-details/pos-product-details.component';
import { SharedDataService } from '../shared-data.service';
import { PosAddRecipientDialogComponent } from './pos-add-recipient-dialog/pos-add-recipient-dialog.component';
import { MatSelectChange } from '@angular/material/select';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import {
  DiscountApplicationType,
  DiscountDto,
  DiscountService,
  DiscountType,
} from '@proxy/discounts';
import { OrderSummary } from '../models/order-summary.model';
import { SubOrderItem } from '../models/sub-order-Item.model';
import {
  CreateUpdateOrderDto,
  CreateUpdateSubOrderDto,
  DeliveryCategory,
  DesignStatus,
  OrderDeliveryStatus,
  OrderDto,
  OrderService,
  OrderStatus,
  OrderType,
  PaymentStatus,
  PriceType,
  priceTypeOptions,
  ShippingDetailsDto,
  SubOrderDeliveryStatus,
  SubOrderDto,
  SubOrderService,
} from '@proxy/orders';
import { ToasterService } from '@abp/ng.theme.shared';
import { ProductItem } from 'src/app/products/product.model';
import { map, Observable, Subject, takeUntil } from 'rxjs';
import { CorporateSettingService } from '@proxy/corporate-settings';
import { PosWillCallDialogComponent } from './pos-will-call-dialog/pos-will-call-dialog.component';
import { PosCarryOutDialogComponent } from './pos-carry-out-dialog/pos-carry-out-dialog.component';
import { PosAddRecipientDetailsDialogComponent } from './pos-add-recipient-details-dialog/pos-add-recipient-details-dialog.component';
import {
  ProductCategoryType,
  ProductService,
  ProductStockDto,
  ProductStockService,
} from '@proxy/products';
import { OrderItem } from '../models/order-item.model';
import { OrderActionType } from 'src/app/order-control-list/models/order-action-type.enum';
import { OccasionCode, RecipientPersonalizationDto } from '@proxy/recipients';
import { ConfigStateService, CurrentUserDto } from '@abp/ng.core';
import { StoreDataService } from 'src/app/store/store.data.service';
import { StoreLookupDto } from '@proxy/stores';

@Component({
  selector: 'app-pos-added-item',
  templateUrl: './pos-added-item.component.html',
  styleUrl: './pos-added-item.component.scss',
})
export class PosAddedItemComponent implements OnInit, OnDestroy {
  addedSubOrderItems: SubOrderItem[] = [];
  displayedColumns: string[] = [
    'select',
    'productName',
    'unitPrice',
    'priceType',
    'quantity',
    'discountCode',
    'discount',
    'total',
    'actions',
  ];

  discountType = DiscountType;
  orderSummary: OrderSummary;

  isDiscountCodeFieldReadOnly$: Observable<boolean>;

  filteredOptions: string[] = [];
  discountCodes: DiscountDto[] = [];
  orderItemDiscountCodes: DiscountDto[] = [];
  defaultImageURL = '/assets/images/demo/demo.png';
  isDiscountOnOrderItemEnabled = true;
  productCategoryType = ProductCategoryType;
  productStockDtoList: ProductStockDto[] = [];

  orderDto: OrderDto;
  priceTypeOptions = priceTypeOptions;
  destroy$: Subject<void> = new Subject();
  orderType = OrderType;
  private currentUser: CurrentUserDto;
  currentStore: StoreLookupDto;

  constructor(
    public dialog: MatDialog,
    private sharedDataService: SharedDataService,
    private discountService: DiscountService,
    private orderService: OrderService,
    private subOrderService: SubOrderService,
    private toasterService: ToasterService,
    private corporateSettingService: CorporateSettingService,
    private productService: ProductService,
    private productStockService: ProductStockService,

    private configState: ConfigStateService,
    private storeDataService: StoreDataService,
  ) {
    this.currentUser = this.configState.getOne('currentUser') as CurrentUserDto;
  }

  ngOnInit(): void {
    this.sharedDataService.clearPos();
    this.getLastAddedProduct();
    this.getLastAddedBatchProducts();
    this.getApplicableDiscountCodes();
    this.getCorporateSetting();
    this.subscribeToOrderSummaryChanges();
    this.isDiscountCodeFieldReadOnly$ = this.sharedDataService.orderSummary.pipe(
      map(x => x.totalDiscountOnOrder > 0 || x.totalDiscountOnDeliveryFee > 0),
    );

    this.subscribeToPaymentMadeNotification();
    this.processOrderAction();
    this.listendToStoreSelectionChange();
  }

  listendToStoreSelectionChange() {
    this.storeDataService.currentStore$.pipe(takeUntil(this.destroy$)).subscribe(store => {
      this.currentStore = store;
    });
  }

  private subscribeToOrderSummaryChanges() {
    this.sharedDataService.orderSummary
      .pipe(takeUntil(this.destroy$))
      .subscribe((x: OrderSummary) => {
        if (!x) return;
        this.orderSummary = x;
        if (this.addedSubOrderItems) {
          this.resetSubOrderItemActions(this.orderSummary);
        }
        if (x.subOrderItems.length === 0) this.addedSubOrderItems = [];
      });
  }

  private subscribeToPaymentMadeNotification() {
    this.sharedDataService.paymentMade$.pipe(takeUntil(this.destroy$)).subscribe(x => {
      if (x) this.orderDto = undefined;
    });
  }

  private processOrderAction() {
    const { orderId, action, orderType } = window.history.state || {};

    if (!orderId || !action) return;
    switch (action) {
      case OrderActionType.ReOrderForCancelledItem:
        this.reOrderForCancelledItem(orderId, orderType);
        break;
      case OrderActionType.ReOrderForCompletedOrder:
        this.placeCompletedOrder(orderId);
        break;
      case OrderActionType.OpenOrderInOrderEntry:
        this.loadOrderDetailsToEditIfNotified(orderId);
        break;
    }
  }

  private mapOrderDtoToOrderItem(orderDto: OrderDto) {
    let addedSubOrderItems = orderDto.subOrderDtos.map(subOrder => {
      const subOrderItem = this.mapSubOrderDtoToSubOrderItem(subOrder);
      subOrderItem.productItem.description = orderDto.isGiftCardOrder
        ? subOrder.orderDetails
        : subOrder.productDto.description;
      return subOrderItem;
    });

    let orderItem: OrderItem = {
      id: orderDto.id,
      orderNumber: orderDto.orderNumber,
      orderTotal: orderDto.orderTotal,
      deliveryTotal: orderDto.deliveryTotal,
      orderDiscount: orderDto.orderDiscount,
      discountCodeId: orderDto.discountCodeId,
      isPartialPaymentAllowed: orderDto.isPartialPaymentAllowed,
      tipAmount: orderDto.tipAmount,
      paidAmount: orderDto.paidAmount,
      taxAmount: orderDto.taxAmount,
      customerId: orderDto.customerId,
      recipientId: orderDto.recipientId,
      orderType: orderDto.orderType,
      orderStatus: orderDto.orderStatus,
      paymentStatus: orderDto.paymentStatus,
      deliveryStatus: orderDto.deliveryStatus,
      reviewType: orderDto.reviewType,
      reviewStatus: orderDto.reviewStatus,
      shopId: orderDto.shopId,
      isActive: orderDto.isActive,
      cancelSaleReasonValueId: orderDto.cancelSaleReasonValueId,
      subOrderItems: addedSubOrderItems,
      isGiftCardOrder: orderDto.isGiftCardOrder,
      employeeId: orderDto.employeeId,
      appliedDiscount: orderDto.discountDto,
      parentOrderId: orderDto.parentOrderId,
      tipValueTypeId: orderDto.tipValueTypeId,
    };

    return orderItem;
  }

  getCorporateSetting() {
    this.corporateSettingService
      .getCorporateSetting()
      .pipe(takeUntil(this.destroy$))
      .subscribe(corporateSetting => {
        this.isDiscountOnOrderItemEnabled = corporateSetting.enableDiscountOnOrderItemSubtotal;
        this.sharedDataService.setCorporateSalesTax(corporateSetting.salesTaxPercentage);
        this.sharedDataService.broadcastOrderSummary();
      });
  }

  getLastAddedBatchProducts() {
    this.sharedDataService.currentProducts.pipe(takeUntil(this.destroy$)).subscribe(products => {
      if (products.length === 0) return;

      let subOrderItems: SubOrderItem[] = products.map(product =>
        this.mapProductToSubOrderItem(product),
      );

      let createUpdateSubOrderDtos = subOrderItems.map(x => {
        return this.prepareCreateUpdateSubOrderDto(x, this.orderDto);
      });

      if (this.orderDto?.id) {
        this.subOrderService.createMany(createUpdateSubOrderDtos).subscribe({
          next: (subOrderDtos: SubOrderDto[]) => {
            let subOrderItems = subOrderDtos.map((x: SubOrderDto) => {
              let item = this.mapSubOrderDtoToSubOrderItem(x);
              item.productItem = this.findProductItemFromAddedSubOrderItemsByProductId(x.productId);
              return item;
            });
            this.addedSubOrderItems = [...this.addedSubOrderItems, ...subOrderItems];
            this.shareOrderSummary();
          },
          error: () => {},
        });
      }
    });
  }

  getApplicableDiscountCodes() {
    this.discountService.getApplicableDiscountCodes().subscribe(x => {
      this.orderItemDiscountCodes = x.filter(
        y => y.discountApplicationType == DiscountApplicationType.Item,
      );
    });
  }

  getLastAddedProduct() {
    this.sharedDataService.currentProduct
      .pipe(takeUntil(this.destroy$))
      .subscribe((product: ProductItem) => {
        if (!product) return;
        product.isProductType = product.productCode !== 'gc';
        let subOrderItem: SubOrderItem = this.mapProductToSubOrderItem(product);

        const hasGiftCard = this.addedSubOrderItems.some(
          item => item.productItem.productCategoryType === ProductCategoryType.GiftCard,
        );
        const hasFlower = this.addedSubOrderItems.some(
          item =>
            !product.productCategoryType ||
            item.productItem.productCategoryType === ProductCategoryType.Flower ||
            item.productItem.productCategoryType === ProductCategoryType.AddOn,
        );

        if (
          (subOrderItem.productItem.productCategoryType === ProductCategoryType.GiftCard &&
            hasFlower) ||
          ((!product.productCategoryType ||
            subOrderItem.productItem.productCategoryType === ProductCategoryType.Flower ||
            subOrderItem.productItem.productCategoryType === ProductCategoryType.AddOn) &&
            hasGiftCard)
        ) {
          this.toasterService.warn(
            'You cannot add both Gift Card and Flower products in the same order.',
          );
          return;
        }

        let createUpdateOrderDto = this.prepareCreateUpdateOrderDto(subOrderItem);
        if (!product.isProductType) {
          this.shareOrderSummary();
          this.addedSubOrderItems = [...this.addedSubOrderItems, subOrderItem];
          return;
        }
        createUpdateOrderDto.employeeId = this.orderSummary?.employeeId;
        createUpdateOrderDto.assignedUserId = this.currentUser.id;

        if (!this.orderDto?.id) {
          this.orderService
            .unassignUserFromOrderIfExists(this.currentUser.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe(isExist => {
              if (isExist) {
                this.toasterService.warn('::OrderControl:UnassignedPreviousOrder');
              }
              this.orderService.create(createUpdateOrderDto).subscribe({
                next: (orderDto: OrderDto) => {
                  this.orderDto = orderDto;
                  subOrderItem.orderId = orderDto.id;
                  subOrderItem.id = orderDto.subOrderDtos[0].id;
                  subOrderItem.storeId = this.currentStore.id;
                  this.sharedDataService.setOrderId(orderDto.id);
                  this.addedSubOrderItems = [...this.addedSubOrderItems, subOrderItem];
                  this.shareOrderSummary();
                  this.sharedDataService.addOrderNumber(orderDto.orderNumber);
                },
                error: () => {},
              });
            });
        } else {
          const createUpdateSubOrderDto: CreateUpdateSubOrderDto =
            this.prepareCreateUpdateSubOrderDto(subOrderItem, this.orderDto);
          this.subOrderService.create(createUpdateSubOrderDto).subscribe({
            next: (subOrderDto: SubOrderDto) => {
              subOrderItem.orderId = subOrderDto.orderId;
              subOrderItem.id = subOrderDto.id;
              this.addedSubOrderItems = [...this.addedSubOrderItems, subOrderItem];
              this.shareOrderSummary();
            },
            error: () => {},
          });
        }
      });
  }

  prepareCreateUpdateOrderDto(subOrderItem: SubOrderItem): CreateUpdateOrderDto {
    const isGiftCardOrder =
      subOrderItem.productItem.productCategoryType === ProductCategoryType.GiftCard;
    const createUpdateSubOrderDto: CreateUpdateSubOrderDto = this.prepareCreateUpdateSubOrderDto(
      subOrderItem,
      this.orderDto,
    );

    const createUpdateOrderDto: CreateUpdateOrderDto = {
      orderType: this.orderSummary.orderType,
      orderStatus: OrderStatus.Abandoned,
      orderTotal: 0,
      deliveryFeeTotal: 0,
      orderDiscount: 0,
      tipAmount: 0,
      paidAmount: 0,
      taxAmount: 0,
      paymentStatus: PaymentStatus.Unpaid,
      discountCodeId: undefined,
      isPartialPaymentAllowed: true,
      reviewType: undefined,
      shopId: undefined,
      customerId: undefined,
      createUpdateSubOrderDtos: [createUpdateSubOrderDto],
      deliveryStatus: OrderDeliveryStatus.ToBeDelivered,
      isGiftCardOrder: isGiftCardOrder,
    };

    return createUpdateOrderDto;
  }

  prepareCreateUpdateSubOrderDto(
    subOrderItem: SubOrderItem,
    orderDto: OrderDto,
  ): CreateUpdateSubOrderDto {
    const createUpdateSubOrderDto: CreateUpdateSubOrderDto = {
      productId: subOrderItem.productId,
      qty: subOrderItem.qty,
      unitPrice: subOrderItem.unitPrice,
      subTotal: subOrderItem.subTotal,
      isLock: false,
      isTimeRequired: true,
      priceType: PriceType.BP,
      isCheckout: false,
      deliveryFee: 0,
      discountAmount: subOrderItem.discountAmount,
      relayFee: 0,
      saleTypeId: 0,
      retryNumber: 0,
      cutoffFee: 0,
      expressFee: 0,
      wireoutFee: 0,
      timeReqFee: 0,
      sundryFee: 0,
      weddingFee: 20.0,
      isWireServiceOrder: false,
      isWillPickup: false,
      isCarryOut: false,
      orderId: orderDto?.id,
      deliveryStatus: SubOrderDeliveryStatus.ToBeDelivered,
      orderDetails: subOrderItem.orderDetails,
      giftCardExpireDate: subOrderItem.giftCardExpireDate,
      salesTax: 0,
      storeId: subOrderItem.storeId,
      designStatus: subOrderItem.designStatus,
    };

    return createUpdateSubOrderDto;
  }

  displayFn(discount: DiscountDto): string {
    return discount && discount.discountCode;
  }

  onDiscountCodeChange(subOrderItem: SubOrderItem) {
    subOrderItem.filteredDiscounts = this.orderItemDiscountCodes.filter(x =>
      x.discountCode.toLowerCase().includes(subOrderItem.discountCode.toLowerCase()),
    );

    if (
      !this.orderItemDiscountCodes.some(
        x => x.discountCode.toLowerCase() === subOrderItem.discountCode.toLowerCase(),
      )
    ) {
      subOrderItem.discountId = null;
      subOrderItem.itemSpecificDiscount = 0;
      subOrderItem.discountType = null;
      subOrderItem.discountAmount = 0;
      this.onQuantityChange(subOrderItem);
    }
  }

  calCulateSubOrderItemSubTotal(subOrderItem: SubOrderItem) {
    subOrderItem.subTotal = subOrderItem.unitPrice * subOrderItem.qty;
  }

  onOptionSelected(event: MatAutocompleteSelectedEvent, subOrderItem: SubOrderItem): void {
    let selectedDiscount = this.orderItemDiscountCodes.find(
      discountCode => discountCode.discountCode === event.option.value,
    );
    if (!selectedDiscount) {
      setTimeout(() => {
        subOrderItem.discountCode = '';
        event.option.value = '';
        event.option.deselect();
        subOrderItem.filteredDiscounts = [...this.orderItemDiscountCodes];

        this.onQuantityChange(subOrderItem);
        this.shareOrderSummary();
      }, 0);

      return;
    }

    let discountedAmountOnItem =
      selectedDiscount?.discountType === DiscountType.Percentage
        ? subOrderItem.subTotal * (selectedDiscount?.discountAmount / 100)
        : selectedDiscount?.discountAmount;

    if (discountedAmountOnItem > subOrderItem.subTotal) {
      this.toasterService.error('::Pos:DiscountLargerThanTotalAmountMessage');
      subOrderItem.discountCode = '';
      event.option.value = '';
      event.option.deselect();
      event.option.viewValue;

      subOrderItem.filteredDiscounts = [...this.orderItemDiscountCodes];

      discountedAmountOnItem = 0;
      this.onQuantityChange(subOrderItem);
      this.shareOrderSummary();
      return;
    }

    let totalDiscountOnItem = 0;
    this.addedSubOrderItems.forEach(item => {
      if (item.discountType === DiscountType.Amount)
        totalDiscountOnItem = totalDiscountOnItem + item.discountAmount;
      if (item.discountType === DiscountType.Percentage)
        totalDiscountOnItem = totalDiscountOnItem + item.subTotal * (item.discountAmount / 100);
    });

    subOrderItem.discountAmount = selectedDiscount.discountAmount;
    subOrderItem.discountCode = selectedDiscount.discountCode;
    subOrderItem.discountId = selectedDiscount.id;
    subOrderItem.discountType =
      selectedDiscount.discountType === DiscountType.Amount
        ? DiscountType.Amount
        : DiscountType.Percentage;
    subOrderItem.itemSpecificDiscount = subOrderItem.discountAmount;

    this.onQuantityChange(subOrderItem);
    this.shareOrderSummary();
  }

  onUnitPriceChange(subOrderItem: SubOrderItem) {
    this.calCulateSubOrderItemSubTotal(subOrderItem);

    let discountAmount =
      subOrderItem?.discountType === DiscountType.Percentage
        ? subOrderItem.subTotal * (subOrderItem.discountAmount / 100)
        : subOrderItem.discountAmount;

    if (discountAmount > subOrderItem.subTotal) {
      this.toasterService.error('::Pos:DiscountLargerThanTotalAmountMessage');
      subOrderItem.discountCode = '';
      subOrderItem.discountAmount = 0;
      subOrderItem.filteredDiscounts = [...this.orderItemDiscountCodes];
      return;
    }

    this.shareOrderSummary();
  }

  onQuantityChange(subOrderItem: SubOrderItem) {
    this.productStockService
      .checkValidProductStock(subOrderItem.productId, subOrderItem.qty, subOrderItem.id)
      .subscribe(product => {
        if (product) {
          this.subOrderService
            .updateSubOrderQuantity(subOrderItem.id, subOrderItem.qty)
            .subscribe(() => {
              this.onUnitPriceChange(subOrderItem);
            });
        } else this.toasterService.error('::Pos:ProductStockUpdateError');
      });
  }

  isAllSelected(): boolean {
    return (
      this.addedSubOrderItems.length && this.addedSubOrderItems.every(product => product.selected)
    );
  }

  isIndeterminate(): boolean {
    return this.addedSubOrderItems.some(product => product.selected) && !this.isAllSelected();
  }

  toggleAll(event: any): void {
    const checked = event.checked;
    this.addedSubOrderItems.forEach(product => (product.selected = checked));
    this.updateSelectedSubOrderIds();
  }

  onCheckboxChange(): void {
    this.updateSelectedSubOrderIds();
  }

  deselectAll(): void {
    this.addedSubOrderItems.forEach(product => (product.selected = false));
  }

  isAnyProductSelected(): boolean {
    return this.addedSubOrderItems.some(product => product.selected);
  }

  getSelectedCount(): number {
    return this.addedSubOrderItems.filter(product => product.selected).length;
  }

  showProductDetails(product: any, hideSection: boolean = false, subOrderId: number): void {
    this.dialog.open(PosProductDetailsComponent, {
      width: '700px',
      data: { ...product, hideSection, subOrderId },
    });
  }

  handleImageError(event: any) {
    event.target.src = this.defaultImageURL;
  }

  onPriceTypeSelectionChange(event: MatSelectChange, orderItem: SubOrderItem) {
    let selectedPriceType = event.value;
    if (selectedPriceType === PriceType.BP) {
      orderItem.unitPrice = orderItem.productItem.basePrice;
    } else if (selectedPriceType === PriceType.MP) {
      orderItem.unitPrice = orderItem.productItem.midPrice;
    } else if (selectedPriceType === PriceType.HP) {
      orderItem.unitPrice = orderItem.productItem.highPrice;
    } else if (selectedPriceType === PriceType.GiftCard) {
      orderItem.unitPrice = orderItem.productItem.highPrice;
    } else {
      orderItem.unitPrice = orderItem.productItem.wireOut;
    }
    this.onQuantityChange(orderItem);
    this.shareOrderSummary();
  }

  shareOrderSummary() {
    let orderSummary = this.sharedDataService.prepareOrderSummary(this.addedSubOrderItems);
    this.sharedDataService.shareOrderSummary(orderSummary);
  }

  copyOrderItems() {
    let productItems = this.addedSubOrderItems.filter(x => x.selected).map(x => x.productItem);
    this.sharedDataService.addProducts(productItems);
  }

  deleteOrderItems() {
    let selectedSubOrderItemIds = this.addedSubOrderItems.filter(x => x.selected).map(x => x.id);
    this.subOrderService.deleteMany(selectedSubOrderItemIds).subscribe({
      next: () => {
        let unSelectedSubOrderItems = this.addedSubOrderItems.filter(x => !x.selected);
        this.addedSubOrderItems = [...unSelectedSubOrderItems];
        this.shareOrderSummary();
      },
      error: () => {},
    });
  }

  onRecipientNameClick(subOrderItem: SubOrderItem): void {
    this.subOrderService.getShippingDetailsBySubOrderIdBySubOrderId(subOrderItem.id).subscribe({
      next: (result: ShippingDetailsDto) => {
        if (result) {
          const dialogRef = this.dialog.open(PosAddRecipientDetailsDialogComponent, {
            width: '1000px',
            data: {
              isEditMode: true,
              recipient: result.recipientDto,
              deliveryDetails: result.deliveryDetailsDto,
              personalizations: result.recipientPersonalizationDtos,
              subOrderItem: subOrderItem,
              isShippingDetailsLoaded: true,
            },
          });

          dialogRef.afterClosed().subscribe(result => {
            if (result) {
              subOrderItem.deliveryCategory = DeliveryCategory.Recipient;
              subOrderItem.recipient = result?.recipientDto;
              subOrderItem.recipientId = result?.recipientDto?.id;
              subOrderItem.zoneSaleTax = result?.zoneSaleTax;
              subOrderItem.deliveryFee = result?.deliveryFee;
              subOrderItem.deliveryFrom = result?.deliveryDetailsDto.deliveryFromDate;
              subOrderItem.deliveryTo = result?.deliveryDetailsDto.deliveryToDate;

              if (result.occasion) subOrderItem.occasionCode = result.occasion;

              this.addedSubOrderItems.forEach(item => {
                if (item.recipientId === result?.recipientDto?.id) {
                  item.deliveryCategory = DeliveryCategory.Recipient;
                  item.recipient = result?.recipientDto;
                  item.recipientId = result?.recipientDto?.id;
                  item.zoneSaleTax = result?.zoneSaleTax;
                  item.deliveryFee = result?.deliveryFee;
                }
              });

              this.sharedDataService.broadcastOrderSummary();
            }
          });
        }
      },
    });
  }

  onCancel(subOrderItem: SubOrderItem): void {
    this.subOrderService.deleteShippingDetailsBySubOrderId(subOrderItem.id).subscribe(() => {
      subOrderItem.deliveryCategory = null;
      subOrderItem.recipient = null;
      subOrderItem.recipientName = null;
      subOrderItem.isCarryOut = false;
      subOrderItem.isWillPickup = false;
      subOrderItem.deliveryFee = 0;
      subOrderItem.zoneSaleTax = 0;

      this.sharedDataService.broadcastOrderSummary();
      this.sharedDataService.calculateTaxAmount();
    });
  }

  onWillCallClick(subOrderItem: SubOrderItem): void {
    this.subOrderService.getShippingDetailsBySubOrderIdBySubOrderId(subOrderItem.id).subscribe({
      next: (result: ShippingDetailsDto) => {
        if (result) {
          const dialogRef = this.dialog.open(PosWillCallDialogComponent, {
            width: '1000px',
            data: {
              deliveryDetails: result.deliveryDetailsDto,
              personalizations: result.recipientPersonalizationDtos,
              subOrderItem: subOrderItem,
            },
          });

          dialogRef
            .afterClosed()
            .subscribe(
              (result: {
                recipientPersonalizationDtos: RecipientPersonalizationDto[];
                occasion: OccasionCode;
              }) => {
                if (result) {
                  subOrderItem.deliveryCategory = DeliveryCategory.WillCall;
                  subOrderItem.personalizations = result.recipientPersonalizationDtos;
                  subOrderItem.recipientName =
                    result.recipientPersonalizationDtos[0]?.recipientName;

                  if (result.occasion) subOrderItem.occasionCode = result.occasion;

                  this.sharedDataService.broadcastOrderSummary();
                }
              },
            );
        }
      },
    });
  }

  onCarryOutClick(subOrderItem: SubOrderItem): void {
    this.subOrderService.getShippingDetailsBySubOrderIdBySubOrderId(subOrderItem.id).subscribe({
      next: (result: ShippingDetailsDto) => {
        if (result) {
          const dialogRef = this.dialog.open(PosCarryOutDialogComponent, {
            width: '1000px',
            data: {
              personalizations: result.recipientPersonalizationDtos,
              subOrderItem: subOrderItem,
            },
          });

          dialogRef
            .afterClosed()
            .subscribe(
              (result: {
                recipientPersonalizationDtos: RecipientPersonalizationDto[];
                occasion: OccasionCode;
              }) => {
                if (result) {
                  subOrderItem.deliveryCategory = DeliveryCategory.CarryOut;
                  subOrderItem.personalizations = result.recipientPersonalizationDtos;
                  subOrderItem.recipientName =
                    result.recipientPersonalizationDtos[0]?.recipientName;

                  if (result.occasion) subOrderItem.occasionCode = result.occasion;

                  this.sharedDataService.broadcastOrderSummary();
                }
              },
            );
        }
      },
    });
  }

  mapProductToSubOrderItem(product: ProductItem): SubOrderItem {
    return {
      orderId: undefined,
      productId: product.id,
      qty: product.bulkQty ?? 1,
      unitPrice:
        !product.productCategoryType || product.productCategoryType !== ProductCategoryType.GiftCard
          ? product.basePrice
          : product.unitCost,
      subTotal:
        !product.productCategoryType || product.productCategoryType !== ProductCategoryType.GiftCard
          ? product.basePrice
          : product.unitCost * product.bulkQty,
      discountAmount: 0,
      selected: false,
      productItem: product,
      filteredDiscounts: this.orderItemDiscountCodes,
      priceType:
        product.productCategoryType === ProductCategoryType.GiftCard
          ? PriceType.GiftCard
          : PriceType.BP,
      deliveryFee: 0,
      orderDetails: product.description,
      giftCardExpireDate: product.giftCardExpireDate ?? null,
      storeId: this.currentStore?.id,
      designStatus: DesignStatus.UnPrint,
    } as SubOrderItem;
  }

  openAddRecipientModal(): void {
    const selectedProducts = this.addedSubOrderItems
      .filter(item => item.selected)
      .map(item => ({
        ...item,
        productCode: item.productItem.productCode,
      }));

    const productCodes = selectedProducts.map(product => product.productCode);
    const dialogRef = this.dialog.open(PosAddRecipientDialogComponent, {
      width: '1000px',
      data: {
        productsData: {
          products: selectedProducts,
        },
        isMasterRecipient: true,
        productCodes: productCodes.length > 1 ? productCodes : null,
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        let occasionCode = 0;
        if (result.occasion) occasionCode = result.occasion;
        result.deliveryFee = result.deliveryFee / this.addedSubOrderItems.length;
        if (Array.isArray(result.shippingDetailsDtos)) {
          this.addedSubOrderItems.forEach(item => {
            if (item.selected) {
              item.deliveryCategory = DeliveryCategory.Recipient;
              item.recipient = result.shippingDetailsDtos[0]?.recipientDto;
              item.recipientId = result.shippingDetailsDtos[0]?.recipientDto?.id;
              item.zoneSaleTax = result?.zoneSaleTax;
              item.deliveryFee = Number(
                (result?.deliveryFee / this.addedSubOrderItems.length).toFixed(2),
              );
              item.isMasterRecipient = true;
              item.occasionCode = occasionCode;
            }
          });
        } else {
          this.addedSubOrderItems.forEach(item => {
            if (item.selected) {
              item.deliveryCategory = DeliveryCategory.Recipient;
              item.recipient = result?.recipientDto;
              item.recipientId = result?.recipientDto?.id;
              item.zoneSaleTax = result?.zoneSaleTax;
              item.deliveryFee = Number(
                (result?.deliveryFee / this.addedSubOrderItems.length).toFixed(2),
              );
              item.isMasterRecipient = true;
              item.occasionCode = occasionCode;
            }
          });
        }

        this.deselectAll();
        this.sharedDataService.broadcastOrderSummary();
      }
    });
  }

  findProductItemFromAddedSubOrderItemsByProductId(productId: string) {
    return this.addedSubOrderItems.find(x => x.productId === productId)?.productItem;
  }

  private mapSubOrderDtoToSubOrderItem(subOrderDto: SubOrderDto): SubOrderItem {
    const discount = this.orderItemDiscountCodes.find(x => x.id === subOrderDto.discountId);

    const recipientName =
      subOrderDto.isWillPickup || subOrderDto.isCarryOut
        ? subOrderDto.recipientPersonalizations[0]?.recipientName
        : null;

    return {
      id: subOrderDto.id,
      orderId: subOrderDto.orderId,
      productId: subOrderDto.productId,
      qty: subOrderDto.qty,
      unitPrice: subOrderDto.unitPrice,
      subTotal: subOrderDto.subtotal,
      discountId: subOrderDto.discountId,
      discountAmount: subOrderDto.discountAmount,
      itemSpecificDiscount: discount?.discountAmount ?? 0,
      selected: false,
      productItem: subOrderDto.productDto as ProductItem,
      discountType: discount?.discountType,
      discountCode: discount?.discountCode,
      deliveryFee: subOrderDto.deliveryFee,
      priceType: subOrderDto.priceType,
      recipientId: subOrderDto.recipientId,
      isWillPickup: subOrderDto.isWillPickup,
      isCarryOut: subOrderDto.isCarryOut,
      deliveryCategory: subOrderDto.deliveryCategory,
      deliveryStatus: subOrderDto.deliveryStatus,
      recipientName: recipientName,
      recipient: subOrderDto.recipientDto,
      orderDetails: subOrderDto.orderDetails,
      giftCardExpireDate: subOrderDto.giftCardExpireDate,
      filteredDiscounts: this.orderItemDiscountCodes,
      personalizations: subOrderDto.recipientPersonalizations,
      deliveryDetailId: subOrderDto.deliveryDetailDto?.id,
      deliveryFrom: subOrderDto?.deliveryDetailDto?.deliveryFromDate,
      deliveryTo: subOrderDto?.deliveryDetailDto?.deliveryToDate,
    } as SubOrderItem;
  }

  shouldDisplayContent(orderItem: any): boolean {
    const orderType = this.orderSummary?.orderType;

    return (
      (!orderItem.recipient && !orderItem.isWillPickup && !orderItem.isCarryOut) ||
      (orderItem.isCarryOut &&
        (orderType === OrderType.SO || orderType === OrderType.PO || orderType === OrderType.DO)) ||
      (!orderItem.recipient && (orderType === OrderType.PU || orderType == OrderType.PHO))
    );
  }

  private resetSubOrderItemActions(orderSummary: OrderSummary): void {
    this.addedSubOrderItems.forEach(subOrder => {
      const isResetEligibleOrderType =
        (this.orderSummary?.orderType === OrderType.SO ||
          this.orderSummary?.orderType === OrderType.PO ||
          this.orderSummary?.orderType === OrderType.DO) &&
        subOrder.isCarryOut;

      const isPickupWithoutRecipient =
        orderSummary.orderType === OrderType.PU && !subOrder.recipient;

      const isPhoneOutWithoutRecipient =
        orderSummary.orderType === OrderType.PHO && !subOrder.recipient;

      if (isResetEligibleOrderType || isPickupWithoutRecipient || isPhoneOutWithoutRecipient) {
        subOrder.isCarryOut = false;
        subOrder.deliveryCategory = null;
      }

      if (isPickupWithoutRecipient || isPhoneOutWithoutRecipient) {
        subOrder.isWillPickup = false;
      }
    });
  }

  private placeCompletedOrder(orderId: any) {
    this.orderService
      .reOrder(orderId, { employeeId: this.orderSummary?.employeeId })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: orderDto => this.handleReOrderSuccess(orderDto),
        error: () => {
          this.toasterService.error('::Pos:ReOrderFailureMessage');
        },
      });
  }

  private reOrderForCancelledItem(orderId: string, orderType: OrderType) {
    this.orderService
      .reOrderForCancelledOrder(orderId, orderType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: orderDto => this.handleReOrderSuccess(orderDto),
        error: () => {
          this.toasterService.error('::Pos:ReOrderFailureMessage');
        },
      });
  }

  private loadOrderDetailsToEditIfNotified(orderId: string) {
    this.orderService.getOrderWithSubOrderDetails(orderId).subscribe({
      next: (orderDto: OrderDto) => {
        this.orderDto = orderDto;
        const orderItem = this.mapOrderDtoToOrderItem(orderDto);
        this.addedSubOrderItems = orderItem.subOrderItems;
        this.sharedDataService.populateOrderSummaryData(orderItem);
      },
    });
  }

  private handleReOrderSuccess(orderDto: OrderDto) {
    this.orderDto = orderDto;
    this.orderService
      .getOrderWithSubOrderDetails(orderDto.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (orderDto: OrderDto) => {
          const orderItem = this.mapOrderDtoToOrderItem(orderDto);
          this.addedSubOrderItems = orderItem.subOrderItems;
          this.sharedDataService.populateOrderSummaryData(orderItem);
        },
      });
  }

  private updateSelectedSubOrderIds() {
    const selectedSubOrders = this.addedSubOrderItems
      .filter(product => product.selected)
      .map(item => item.id);
    this.sharedDataService.updateSelectedSubOrderIds(selectedSubOrders);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
