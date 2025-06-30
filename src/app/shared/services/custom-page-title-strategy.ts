import { Injectable, inject } from '@angular/core';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { RoutesService, LocalizationService } from '@abp/ng.core';
import { CAMEL_OR_NUMBER_BEFORE_UPPER, SEPARATORS, UPPER_BEFORE_CAPITALIZED } from '../constants';

@Injectable()
export class CustomPageTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly routesService = inject(RoutesService);
  private readonly localizationService = inject(LocalizationService);

  override async updateTitle(snapshot: RouterStateSnapshot): Promise<void> {
    const path = snapshot.url.split('?')[0].replace(/\/+$/, '');
    const visibleMenus = this.routesService.visible;
    const appName = this.localizationService.instant('::AppName');

    const matched = this.findMenuByPath(visibleMenus, path);

    if (!matched) {
      this.title.setTitle(appName);
      return;
    }

    const localized = this.localizationService.instant(matched.name);
    const fallbackTitle = this.getFallbackDisplayName(matched.name);
    this.title.setTitle(`${appName} | ${localized || fallbackTitle}`);
  }

  private findMenuByPath(menus: any[], path: string): any | undefined {
    for (const menu of menus) {
      if (menu.path?.replace(/\/+$/, '') === path) {
        return menu;
      }
      if (menu.children?.length) {
        const found = this.findMenuByPath(menu.children, path);
        if (found) return found;
      }
    }

    return undefined;
  }

  private getFallbackDisplayName(menuName: string): string {
    const cleaned = menuName.replace(/^::Menu:/, '');
    return this.splitCamelOrPascalCase(cleaned);
  }

  private splitCamelOrPascalCase(input: string): string {
    return input
      .replace(CAMEL_OR_NUMBER_BEFORE_UPPER, '$1 $2')
      .replace(UPPER_BEFORE_CAPITALIZED, '$1 $2')
      .replace(SEPARATORS, ' ')
      .trim();
  }
}
