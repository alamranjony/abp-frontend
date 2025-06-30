import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  CommissionDto,
  CommissionFilter,
  CommissionOnLocalOrderDto,
  CommissionOnWireOrderDto,
  CommissionService,
  CreateUpdateCommissionDto,
} from '@proxy/sales-commissions';
import { ToasterService } from '@abp/ng.theme.shared';
import { EmployeeLookupDto, EmployeeService } from '@proxy/employees';

@Component({
  selector: 'app-sales-commissions',
  templateUrl: './sales-commissions.component.html',
  styleUrl: './sales-commissions.component.scss',
})
export class SalesCommissionsComponent implements OnInit {
  form: FormGroup;
  employees: EmployeeLookupDto[];
  readonly emptyGuid = '00000000-0000-0000-0000-000000000000';
  isEditMode: boolean = false;

  constructor(
    private commissionService: CommissionService,
    private employeeService: EmployeeService,
    private fb: FormBuilder,
    private toaster: ToasterService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.getEmployees();
    this.buildForm();
  }

  getEmployees() {
    this.employeeService.getEmployeeLookup().subscribe(res => {
      this.employees = res.items;
    });
  }

  buildForm() {
    this.form = this.fb.group({
      id: [this.emptyGuid, Validators.required],
      employeeId: [null, Validators.required],
      pickupOrderAboveLimit: [0, Validators.required],
      pickupOrderBelowLimit: [0, Validators.required],
      outgoingWireOrderBonusOver100Order: [0, Validators.required],
      commissionOnLocalOrderDtos: this.fb.array([]),
      commissionOnWireOrderDtos: this.fb.array([]),
    });
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toaster.error('::ValidationError:InvalidFormOrData');
      return;
    }

    const commissionDto = { ...this.form.value } as CreateUpdateCommissionDto;
    commissionDto.employeeId = commissionDto.employeeId == '0' ? null : commissionDto.employeeId;
    const id = this.form.get('id').value;
    const request = this.isEditMode
      ? this.commissionService.update(id, commissionDto)
      : this.commissionService.create(commissionDto);

    request.subscribe({
      next: response => {
        response.employeeId = this.form.get('employeeId')?.value;
        this.updateForm(response);
        this.toaster.success('::Commission.SavedSuccessfully');
      },
      error: err => {
        this.toaster.error('::Commission.SaveError');
      },
    });
  }

  get wireOrderCommissions(): FormArray {
    return this.form.get('commissionOnWireOrderDtos') as FormArray;
  }

  addWireOrderCommission(commissionOnWireOrderDto: CommissionOnWireOrderDto = null) {
    const wireCommissionGroup = this.fb.group({
      wireOrderMinValue: [
        commissionOnWireOrderDto ? commissionOnWireOrderDto.wireOrderMinValue : 0,
        Validators.required,
      ],
      wireOrderMaxValue: [
        commissionOnWireOrderDto ? commissionOnWireOrderDto.wireOrderMaxValue : 0,
        Validators.required,
      ],
      commission: [
        commissionOnWireOrderDto ? commissionOnWireOrderDto.commission : 0,
        Validators.required,
      ],
      id: [commissionOnWireOrderDto ? commissionOnWireOrderDto.id : this.emptyGuid],
    });

    this.wireOrderCommissions.push(wireCommissionGroup);
    this.cdr.detectChanges();
  }

  removeWireOrderCommission(id) {
    this.wireOrderCommissions.removeAt(id);
  }

  get localOrderCommissions(): FormArray {
    return this.form.get('commissionOnLocalOrderDtos') as FormArray;
  }

  addLocalOrderCommission(commissionOnLocalOrderDto: CommissionOnLocalOrderDto = null) {
    const localCommissionGroup = this.fb.group({
      localOrderMinValue: [
        commissionOnLocalOrderDto ? commissionOnLocalOrderDto.localOrderMinValue : 0,
        Validators.required,
      ],
      localOrderMaxValue: [
        commissionOnLocalOrderDto ? commissionOnLocalOrderDto.localOrderMaxValue : 0,
        Validators.required,
      ],
      payoutAmount: [
        commissionOnLocalOrderDto ? commissionOnLocalOrderDto.payoutAmount : 0,
        Validators.required,
      ],
      id: [commissionOnLocalOrderDto ? commissionOnLocalOrderDto.id : this.emptyGuid],
    });

    this.localOrderCommissions.push(localCommissionGroup);
    this.cdr.detectChanges();
  }

  removeLocalOrderCommission(id) {
    this.localOrderCommissions.removeAt(id);
  }

  onEmployeeChange(event: any): void {
    const filter = {} as CommissionFilter;
    filter.employeeId = event.value == 0 ? null : event.value;
    this.commissionService.getCommissionByEmployeeId(filter).subscribe(response => {
      if (response) {
        response.employeeId = event.value;
        this.updateForm(response);
      } else {
        this.isEditMode = false;
        this.clearForm();
        this.form.get('employeeId')?.setValue(event.value);
      }
    });
  }

  clearForm(): void {
    this.form.reset(
      {
        id: this.emptyGuid,
        employeeId: null,
        pickupOrderAboveLimit: 0,
        pickupOrderBelowLimit: 0,
        outgoingWireOrderBonusOver100Order: 0,
      },
      { emitEvent: false },
    );

    this.removeLocalOrderCommissions();
    this.removeWireOrderCommissions();
    this.cdr.detectChanges();
  }
  removeWireOrderCommissions(): void {
    while (this.wireOrderCommissions.length !== 0) {
      this.wireOrderCommissions.removeAt(0);
    }
  }

  removeLocalOrderCommissions(): void {
    while (this.localOrderCommissions.length !== 0) {
      this.localOrderCommissions.removeAt(0);
    }
  }

  updateForm(commissionDto: CommissionDto): void {
    this.clearForm();
    this.isEditMode = true;
    this.form.patchValue(commissionDto);
    commissionDto.commissionOnLocalOrderDtos.forEach(dto => this.addLocalOrderCommission(dto));
    commissionDto.commissionOnWireOrderDtos.forEach(dto => this.addWireOrderCommission(dto));
  }
}
