import { Component, OnInit } from '@angular/core';
import { ProductDto } from '@proxy/products';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-product-add-edit',
  templateUrl: './product-add-edit.component.html',
})
export class ProductAddEditComponent implements OnInit {
  pageTitle = '::NewProduct';
  model = {} as ProductDto;
  loadForm = true;

  constructor(private activatedRoute: ActivatedRoute) {}

  ngOnInit() {
    const url = this.activatedRoute.snapshot.url[0];
    let id = '';
    if (url.path == 'edit') {
      this.pageTitle = '::EditProduct';
      id = this.activatedRoute.snapshot.params['id'] || '';
      this.model.id = id;
    }
  }
}
