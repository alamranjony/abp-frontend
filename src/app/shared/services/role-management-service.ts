import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RoleManagementService {
  private refreshList = new Subject<void>();

  refresh$ = this.refreshList.asObservable();
  emitRefresh() {
    this.refreshList.next();
  }
}
