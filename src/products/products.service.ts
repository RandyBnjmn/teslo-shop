import { use } from 'passport';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Equal, Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { validate as isUUID } from 'uuid';
import { ProductImage } from './entities';
import { User } from 'src/auth/entities/user.entity';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger('ProductsServices');
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,

    private readonly dataSource: DataSource
  ) { }

  async create(createProductDto: CreateProductDto, user: User) {
    try {

      const { images = [], ...productProperties } = createProductDto

      const newProduct = this.productRepository.create({
        ...productProperties,
        images: images.map((image) => this.productImageRepository.create({ url: image })),
        user: user


      });
      await this.productRepository.save(newProduct);
      return { ...newProduct, images };
    } catch (error) {
      this.handledDbError(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;
    const products = await this.productRepository.find({
      skip: offset,
      take: offset,
      relations: {
        images: true
      }
    });

    return products.map((product) => ({
      ...product,
      images: product.images.map((img) => img.url)
    }))
  }

  async findOnPlain(term: string) {
    const { images = [], ...rest } = await this.findOne(term);
    return {
      ...rest,
      images: images.map(img => img.url)
    }
  }

  async findOne(term: string) {
    let product: Product;

    if (isUUID(term)) {
      product = await this.productRepository.findOneBy({ id: term });
    } else {
      const queryBuilder = this.productRepository.createQueryBuilder();

      product = await queryBuilder
        .where(`LOWER(title) = LOWER(:title) or slug=:slug`, {
          title: term,
          slug: term.toLowerCase(),
        })
        .getOne();
    }

    if (!product) {
      throw new NotFoundException(`Product with term  ${term} not found`);
    }
    return product;
  }

  //TODO:Pendiente implementar
  async update(id: string, updateProductDto: UpdateProductDto, user: User) {

    const { images, ...rest } = updateProductDto;




    const product = await this.productRepository.preload({
      id,
      ...rest
      ,
    });

    if (!product) throw new NotFoundException(`Product with id: ${id} not found`)


    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    await queryRunner.startTransaction();


    try {
      if (images) {
        await queryRunner.manager.delete(ProductImage, { product: { id } })

        product.images = images.map((img) => this.productImageRepository.create({ url: img }))

      }

      product.user = user;
      await queryRunner.manager.save(product);
      await queryRunner.commitTransaction();
      await queryRunner.release();

      return this.findOnPlain(id);

    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();

      this.handledDbError(error);
    }
  }

  async remove(id: string) {
    const product = await this.findOne(id);

    return await this.productRepository.remove(product);
  }

  private handledDbError(error) {
    if (error.code === '23505') {
      throw new BadRequestException(error.detail);
    }
    this.logger.error(error);
    throw new InternalServerErrorException('AYUUUDAAAAA');
  }



  //Eliminando todo cuando haga el seed


  async deletedProducts() {
    const query = this.productRepository.createQueryBuilder('product');

    try {
      return await query
        .delete()
        .where({})
        .execute();
    } catch (error) {

      this.handledDbError(error)

    }
  }
}
