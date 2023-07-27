import { Inject, Injectable } from '@nestjs/common';
import { ProductsService } from 'src/products/products.service';
import { initialData } from './data/data';


@Injectable()
export class SeedService {


  /**
   *
   */
  constructor(private readonly productService: ProductsService) {


  }



  async runSeed() {

    await this.insertNewProducts();

    return "Ruun seed"
  }


  async insertNewProducts() {

    await this.productService.deletedProducts()

    const seedProducts = initialData.products;

    const insertPromises = [];

    seedProducts.forEach((product) => {
      insertPromises.push(this.productService.create(product));
    });

    await Promise.all(insertPromises);



    return true;
  }

}
