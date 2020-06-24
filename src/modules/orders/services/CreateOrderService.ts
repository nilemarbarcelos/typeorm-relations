import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customerExists = await this.customersRepository.findById(customer_id);

    if (!customerExists) {
      throw new AppError('Customer does not exist');
    }

    const foundProducts = await this.productsRepository.findAllById(
      products.map(prod => {
        return { id: prod.id };
      }),
    );

    if (foundProducts.length === 0) {
      throw new AppError('Products were not found');
    }

    const parsedProducts = products.map(product => {
      const productFound = foundProducts.find(p => p.id === product.id);

      if (productFound && productFound.quantity < product.quantity) {
        throw new AppError(
          'The quantity on the order is bigger than the available for the product!',
        );
      }

      const price = productFound ? productFound.price : 0;
      return {
        product_id: product.id,
        price,
        quantity: product.quantity,
      };
    });

    await this.productsRepository.updateQuantity(
      products.map(product => {
        return {
          id: product.id,
          quantity: product.quantity,
        };
      }),
    );

    const orderCreated = await this.ordersRepository.create({
      customer: customerExists,
      products: parsedProducts,
    });

    return orderCreated;
  }
}

export default CreateOrderService;
