import { Injectable } from '@angular/core';
import { StoreLookupDto } from '@proxy/stores';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StoreDataService {
  private currentStore = new BehaviorSubject<StoreLookupDto>(null);
  currentStore$ = this.currentStore.asObservable();

  constructor() {}

  setCurrentStore(store?: StoreLookupDto) {
    this.currentStore.next(store);
  }
}
