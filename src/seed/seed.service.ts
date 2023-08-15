import { use } from 'passport';
import { Inject, Injectable } from '@nestjs/common';
import { ProductsService } from 'src/products/products.service';
import { initialData } from './data/data';
import { User } from 'src/auth/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';


@Injectable()
export class SeedService {


  /**
   *
   */
  constructor(private readonly productService: ProductsService, @InjectRepository(User) private readonly userRepository: Repository<User>) {


  }



  async runSeed() {

    await this.deleteTables();

    const userAdmin = await this.insertUser();


    await this.insertNewProducts(userAdmin);

    return "Ruun seed"
  }

  private async insertUser() {
    const seedUsers = initialData.users;

    const users: User[] = []

    seedUsers.forEach(user => {
      users.push(this.userRepository.create(user))
    })

    const dbUsers = await this.userRepository.save(users)

    return dbUsers[0];
  }


  async insertNewProducts(user: User) {

    await this.productService.deletedProducts()

    const seedProducts = initialData.products;

    const insertPromises = [];

    seedProducts.forEach((product) => {
      insertPromises.push(this.productService.create(product, user));
    });

    await Promise.all(insertPromises);



    return true;
  }

  private async deleteTables() {

    await this.productService.deletedProducts()

    const queryBuilder = await this.userRepository.createQueryBuilder();

    await queryBuilder
      .delete()
      .where({})
      .execute();

  }

}
