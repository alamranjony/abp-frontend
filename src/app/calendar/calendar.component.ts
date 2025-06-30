import { Component } from '@angular/core';
import {
  CreateUpdateDeliveryModeDateDto,
  DeliveryModeDateMapService,
  DeliveryModeDto,
} from '@proxy/deliveries';
import { AppointmentDialogComponent } from './appointment-dialog/appointment-dialog.component';
import { ListService, PermissionService } from '@abp/ng.core';
import { ToasterService } from '@abp/ng.theme.shared';
import { MatDialog } from '@angular/material/dialog';
import { permissions } from '../shared/common-utils';

interface Appointment {
  uuid?: string;
  date: Date;
  deliveryModeName: string;
  endTime: string;
  color?: string;
  deliveryModeId: string;
}

export enum CalendarView {
  Month = 'month',
  Week = 'week',
  Day = 'day',
}

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
  providers: [ListService],
})
export class CalendarComponent {
  viewDate: Date = new Date();
  selectedDate: Date | null = null;
  weekDays: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  monthDays: Date[] = [];
  appointments: Appointment[] = [];
  currentView: CalendarView = CalendarView.Month;
  timeSlots: string[] = [];

  weeks: Date[][] = [];
  deliveryModes: DeliveryModeDto[] = [];

  public CalendarView = CalendarView;
  hasDeliveryModelCalendarEditPermission: boolean = false;

  constructor(
    public dialog: MatDialog,
    private deliveryModeDateMapService: DeliveryModeDateMapService,
    private toasterService: ToasterService,
    private permissionService: PermissionService,
  ) {
    this.appointments.forEach(appointment => {
      appointment.color = this.getRandomColor();
    });
    this.generateView(this.currentView, this.viewDate);
    this.getAllDeliveryModeDateMapList();

    this.hasDeliveryModelCalendarEditPermission = this.permissionService.getGrantedPolicy(
      permissions.DeliveryModelCalender,
    );
  }

  generateView(view: CalendarView, date: Date) {
    switch (view) {
      case CalendarView.Month:
        this.generateMonthView(date);
        break;
    }
  }

  generateMonthView(date: Date) {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    this.weeks = [];
    this.monthDays = [];
    let week: Date[] = [];

    for (let day = start.getDay(); day > 0; day--) {
      const prevDate = new Date(start);
      prevDate.setDate(start.getDate() - day);
      week.push(prevDate);
      this.monthDays.push(prevDate);
    }

    for (let day = 1; day <= end.getDate(); day++) {
      const currentDate = new Date(date.getFullYear(), date.getMonth(), day);
      this.monthDays.push(currentDate);
      week.push(currentDate);
      if (week.length === 7) {
        this.weeks.push(week);
        week = [];
      }
    }

    for (let day = 1; this.monthDays.length % 7 !== 0; day++) {
      const nextDate = new Date(end);
      nextDate.setDate(end.getDate() + day);
      this.monthDays.push(nextDate);
    }

    for (let day = 1; week.length < 7; day++) {
      const nextDate = new Date(end);
      nextDate.setDate(end.getDate() + day);
      week.push(nextDate);
    }

    if (week.length > 0) {
      this.weeks.push(week);
    }
  }

  switchToView(view: CalendarView) {
    this.currentView = view;
    this.generateView(this.currentView, this.viewDate);
  }

  startOfWeek(date: Date): Date {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(start.setDate(diff));
  }

  previous() {
    if (this.currentView === 'month') {
      this.viewDate = new Date(this.viewDate.setMonth(this.viewDate.getMonth() - 1));
      this.generateMonthView(this.viewDate);
    }
  }

  next() {
    if (this.currentView === 'month') {
      this.viewDate = new Date(this.viewDate.setMonth(this.viewDate.getMonth() + 1));
      this.generateMonthView(this.viewDate);
    }
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  isSelected(date: Date): boolean {
    if (!this.selectedDate) {
      return false;
    }
    return (
      date.getDate() === this.selectedDate.getDate() &&
      date.getMonth() === this.selectedDate.getMonth() &&
      date.getFullYear() === this.selectedDate.getFullYear()
    );
  }

  isSameDate(date1: Date, date2: Date): boolean {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  }

  selectDate(date?: Date) {
    if (!this.hasDeliveryModelCalendarEditPermission) return;

    if (date) {
      this.selectedDate = date;
    } else {
      this.selectedDate = new Date();
    }
    this.openDialog();
  }

  addAppointment(date: Date, deliveryModeId: string, endTime: Date) {
    let createOrUpdateDto: CreateUpdateDeliveryModeDateDto = {
      deliveryModeId: deliveryModeId,
      deliveryDate: date.toLocaleDateString(),
      deliveryDateRangeTo: endTime?.toLocaleDateString(),
    };
    this.createOrUdateDeliveryModeOnCalendar(createOrUpdateDto);
  }

  deleteAppointment(uuid: string) {
    this.deliveryModeDateMapService.delete(uuid).subscribe({
      next: () => {
        this.toasterService.success('::DeliveryModeCalendar:DeleteMessage');
        this.getAllDeliveryModeDateMapList();
      },
      error: () => {
        this.toasterService.error('::DeliveryModeCalendar:ErrorMessage');
      },
    });
  }

  openDialog(): void {
    const hour = new Date().getHours();
    const minutes = new Date().getMinutes();
    const h = hour < 10 ? `0${hour}` : hour;
    const m = minutes < 10 ? `0${minutes}` : minutes;
    const dialogRef = this.dialog.open(AppointmentDialogComponent, {
      width: '500px',
      panelClass: 'dialog-container',
      data: {
        date: this.selectedDate,
        deliveryModeName: '',
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.addAppointment(result.date, result.deliveryModeId, result.endTime);
      }
    });
  }

  viewToday(): void {
    this.viewDate = new Date();
    this.generateMonthView(this.viewDate);
  }

  isCurrentMonth(date: Date): boolean {
    return (
      date.getMonth() === this.viewDate.getMonth() &&
      date.getFullYear() === this.viewDate.getFullYear()
    );
  }

  getRandomColor(): string {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    const a = 0.4;
    return `rgba(${r},${g},${b},${a})`;
  }

  editAppointment(appointment: Appointment, event: Event) {
    if (!this.hasDeliveryModelCalendarEditPermission) return;

    event.preventDefault();
    const dialogRef = this.dialog.open(AppointmentDialogComponent, {
      width: '500px',
      panelClass: 'dialog-container',
      data: {
        ...appointment,
        deliveryModes: this.deliveryModes,
        deliveryModeId: appointment.deliveryModeId,
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result.remove) {
        let createOrUpdateDto: CreateUpdateDeliveryModeDateDto = {
          deliveryModeId: result.deliveryModeId,
          deliveryDate: result.date.toLocaleDateString(),
          deliveryDateRangeTo: result.endTime?.toLocaleDateString(),
        };
        this.createOrUdateDeliveryModeOnCalendar(createOrUpdateDto);
      }

      if (result.remove) {
        this.deleteAppointment(result.uuid);
      }
    });
  }

  getAllDeliveryModeDateMapList() {
    this.deliveryModeDateMapService.getAllDeliveryModeDeliveryDateList().subscribe(result => {
      if (result) {
        this.appointments = result.map(x => {
          let appointment = {
            uuid: x.id,
            date: new Date(x.deliveryDate),
            deliveryModeName: x.name,
            deliveryModeId: x.deliveryModeId,
          } as Appointment;

          return appointment;
        });
      }
    });
  }

  createOrUdateDeliveryModeOnCalendar(createOrUpdateDto: CreateUpdateDeliveryModeDateDto) {
    this.deliveryModeDateMapService.createOrUpdate(createOrUpdateDto).subscribe({
      next: () => {
        this.toasterService.success('::DeliveryModeCalendar:UpdateSuccessMessage');
        this.getAllDeliveryModeDateMapList();
      },
      error: () => {
        this.toasterService.error('::DeliveryModeCalendar:ErrorMessage');
      },
    });
  }
}
