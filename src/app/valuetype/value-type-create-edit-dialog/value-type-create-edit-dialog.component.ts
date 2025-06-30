import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { LocalizationService } from '@abp/ng.core';
import { ValueTypeService } from '@proxy/values';
import { MatSelectChange } from '@angular/material/select';
import { ToasterService } from '@abp/ng.theme.shared';

@Component({
  selector: 'app-value-type-create-edit-dialog',
  templateUrl: './value-type-create-edit-dialog.component.html',
  styleUrl: './value-type-create-edit-dialog.component.scss',
})
export class ValueTypeCreateEditDialogComponent implements OnInit {
  form: FormGroup;
  valueTypeSettingParents: string[] = [];
  valueTypeSettingChildren: string[] = [];
  private valueTypeValueListMapping: Record<string, any> = {};

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ValueTypeCreateEditDialogComponent>,
    public abpLocalization: LocalizationService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly valueTypeService: ValueTypeService,
    private toaster: ToasterService,
  ) {}

  ngOnInit() {
    this.initializeForm();
    this.loadValueTypeData();
  }

  onParentValueTypeChange(event: MatSelectChange): void {
    const parent = event.value;
    this.valueTypeSettingChildren = parent ? this.valueTypeValueListMapping[parent] || [] : [];

    this.toggleChildField(!!parent);

    this.form.get('valueTypeSettingChild')?.setValue(this.valueTypeSettingChildren[0] || null);
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      name: ['', Validators.required],
      isActive: [false],
      valueTypeSettingParent: [0],
      valueTypeSettingChild: [{ value: null, disabled: true }],
    });
  }

  private loadValueTypeData(): void {
    this.valueTypeService.getValueTypeValueListMapping().subscribe(result => {
      this.valueTypeValueListMapping = result.valueTypeValueListMapping;
      this.valueTypeSettingParents = Object.keys(this.valueTypeValueListMapping);
      this.populateForm();
    });
  }

  private populateForm(): void {
    const [_, parent, child] = this.data?.mappedValueTypeSettingName?.split('.') || [];
    this.valueTypeSettingChildren = this.valueTypeValueListMapping[parent] || [];

    this.form.patchValue({
      name: this.data?.name || '',
      isActive: this.data?.isActive || false,
      valueTypeSettingParent: parent || 0,
      valueTypeSettingChild: child || null,
    });

    this.toggleChildField(!!parent);
  }

  onSave(): void {
    if (this.form.invalid) {
      this.toaster.error('::ValidationError:InvalidFormOrData');
      return;
    }

    if (this.form.get('valueTypeSettingParent').value === 0) {
      this.form.patchValue({
        valueTypeSettingParent: null,
      });
    }
    this.dialogRef.close(this.form.value);
  }

  onClose(): void {
    this.dialogRef.close();
  }

  private toggleChildField(enable: boolean): void {
    const childField = this.form.get('valueTypeSettingChild');
    enable ? childField?.enable() : childField?.disable();
  }
}
