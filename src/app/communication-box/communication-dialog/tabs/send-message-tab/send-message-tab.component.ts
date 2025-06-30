import {
  Component,
  effect,
  ElementRef,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
  WritableSignal,
} from '@angular/core';
import { ShopLookupDto, ShopService } from '@proxy/shops';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { WireService, wireServiceOptions } from '@proxy/common';
import { MatSelectChange } from '@angular/material/select';
import { ToasterService } from '@abp/ng.theme.shared';
import { MatDialogRef } from '@angular/material/dialog';
import { CommunicationDialogComponent } from '../../communication-dialog.component';
import { MessageService, SendMessageDto } from '@proxy/messages';
import {
  catchError,
  distinctUntilChanged,
  map,
  merge,
  Observable,
  of,
  shareReplay,
  startWith,
  Subject,
  switchMap,
  take,
  takeUntil,
} from 'rxjs';
import { ListService } from '@abp/ng.core';
import { debounceTime, finalize } from 'rxjs/operators';
import { DEBOUNCE_TIME } from '../../../../shared/constants';
import {
  MatAutocompleteSelectedEvent,
  MatAutocompleteTrigger,
} from '@angular/material/autocomplete';
import { COMMA, ENTER } from '@angular/cdk/keycodes';

@Component({
  selector: 'app-send-message-tab',
  standalone: false,
  templateUrl: './send-message-tab.component.html',
  styleUrl: './send-message-tab.component.scss',
})
export class SendMessageTabComponent implements OnInit, OnDestroy {
  @ViewChild('shopInput') shopInput: ElementRef<HTMLInputElement>;
  @ViewChild(MatAutocompleteTrigger) private autoTrigger: MatAutocompleteTrigger;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  form: FormGroup;
  filteredShops$: Observable<ShopLookupDto[]>;
  selectedShops: WritableSignal<ShopLookupDto[]> = signal([]);
  isLoading: WritableSignal<boolean> = signal(false);
  hasFetchedInitial = false;
  wireServices = wireServiceOptions;
  private selectedWireService?: WireService = null;
  private destroy$: Subject<void> = new Subject();
  private wireServiceSubject = new Subject<WireService>();

  constructor(
    private fb: FormBuilder,
    private shopService: ShopService,
    private toaster: ToasterService,
    private dialogRef: MatDialogRef<CommunicationDialogComponent>,
    private readonly list: ListService,
    private readonly messageService: MessageService,
  ) {
    effect(() => {
      this.form.get('selectedShops')?.setValue(this.selectedShops());
    });
  }

  ngOnInit(): void {
    this.buildForm();
    this.configureShopFiltering();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  sendMessage(): void {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }

    const sendMessageDto: SendMessageDto = {
      wireService: this.form.get('wireService')?.value,
      content: this.form.get('message')?.value,
      receivingShopIds: this.selectedShops().map(x => x.id),
    };

    this.messageService
      .sendMessage(sendMessageDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.resetForm();
        this.toaster.success('::CommunicationBox:SendMessage:MessageSentSuccessfully');
      });
  }

  close(): void {
    this.dialogRef.close();
  }

  onChangeWireService(event: MatSelectChange): void {
    if (!event) {
      return;
    }

    this.selectedWireService = event.value as WireService;
    this.selectedShops.set([]);

    this.wireServiceSubject.next(this.selectedWireService);
    this.enableFields();
  }

  onShopFocus() {
    if (!this.hasFetchedInitial && this.selectedWireService) {
      this.autoTrigger.openPanel();
    }
  }

  onShopSelected(event: MatAutocompleteSelectedEvent): void {
    const shop = event.option.value as ShopLookupDto;
    this.addShop(shop);
    this.form.get('shopQuery').setValue('');
    this.shopInput.nativeElement.value = '';
    this.autoTrigger.closePanel();
    event.option.deselect();
  }

  removeShop(shop: ShopLookupDto) {
    const updatedShops = this.selectedShops().filter(x => x.id !== shop.id);
    this.selectedShops.set(updatedShops);
  }

  private addShop(shop: ShopLookupDto) {
    if (!this.selectedShops().find(x => x.id === shop.id)) {
      this.selectedShops.update(shops => [...shops, shop]);
    }
  }

  private buildForm() {
    this.form = this.fb.group({
      wireService: [null, Validators.required],
      message: [{ value: '', disabled: true }, [Validators.required, Validators.minLength(5)]],
      shopQuery: this.fb.control({ value: '', disabled: true }),
      selectedShops: this.fb.control({ value: [], disabled: true }, [
        Validators.required,
        Validators.minLength(1),
      ]),
    });
  }

  private loadShops(filter: string): Observable<ShopLookupDto[]> {
    if (!this.selectedWireService) return of([]);

    this.isLoading.set(true);

    return this.list
      .hookToQuery(query =>
        this.shopService.getShopsByWireService({
          ...query,
          filter: filter,
          wireServiceId: this.selectedWireService,
        }),
      )
      .pipe(
        take(1),
        takeUntil(this.destroy$),
        map(result => {
          this.hasFetchedInitial = true;
          return result.items;
        }),
        catchError(() => {
          return of([]);
        }),
        finalize(() => this.isLoading.set(false)),
      );
  }

  private enableFields() {
    this.form.get('message')?.enable();
    this.form.get('shopQuery').enable();
    this.form.get('selectedShops')?.enable();
  }

  private configureShopFiltering() {
    const shopQueryControl = this.form.get('shopQuery') as FormControl;
    this.filteredShops$ = merge(
      shopQueryControl.valueChanges.pipe(startWith(''), debounceTime(DEBOUNCE_TIME)),
      this.wireServiceSubject,
    ).pipe(
      distinctUntilChanged(),
      switchMap(() => this.loadShops(shopQueryControl.value)),
      shareReplay(1),
    );

    if (this.selectedWireService) {
      this.wireServiceSubject.next(this.selectedWireService);
    }
  }

  private resetForm() {
    this.form.reset({
      wireService: null,
      message: '',
      shopQuery: '',
      selectedShops: [],
    });
    this.selectedShops.set([]);
    this.hasFetchedInitial = false;

    this.form.get('message')?.disable();
    this.form.get('shopQuery')?.disable();
    this.form.get('selectedShops')?.disable();

    this.form.get('wireService').markAsUntouched();
    this.form.get('wireService')!.markAsPristine();
  }
}
