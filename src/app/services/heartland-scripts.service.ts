import { ResolveFn } from '@angular/router';
import { inject, Injectable } from '@angular/core';
import { HEARTLAND_GLOBAL_PAYMENT_JS, HEARTLAND_SECURE_SUBMIT_JS } from '../shared/constants';

@Injectable({
  providedIn: 'root',
})
export class HeartlandScriptsService {
  loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(`Failed to load script: ${src}`);
      document.body.appendChild(script);
    });
  }

  loadHeartlandScripts(): Promise<void> {
    return this.loadScript(HEARTLAND_SECURE_SUBMIT_JS).then(() =>
      this.loadScript(HEARTLAND_GLOBAL_PAYMENT_JS),
    );
  }
}

export const heartlandScriptsResolver: ResolveFn<void> = () => {
  const heartlandService = inject(HeartlandScriptsService);
  return heartlandService.loadHeartlandScripts();
};
