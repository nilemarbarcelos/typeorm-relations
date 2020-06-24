import { getRepository, Repository } from 'typeorm';

import IOrdersRepository from '@modules/orders/repositories/IOrdersRepository';
import ICreateOrderDTO from '@modules/orders/dtos/ICreateOrderDTO';
import Order from '../entities/Order';
import OrdersProducts from '../entities/OrdersProducts';

class OrdersRepository implements IOrdersRepository {
  private ormRepository: Repository<Order>;

  constructor() {
    this.ormRepository = getRepository(Order);
  }

  public async create({ customer, products }: ICreateOrderDTO): Promise<Order> {
    const ordersProducts: OrdersProducts[] = products.map(p => {
      const newOrderProducts = new OrdersProducts();
      Object.assign(newOrderProducts, {
        price: p.price,
        quantity: p.quantity,
        product_id: p.product_id,
      });
      return newOrderProducts;
    });

    const order = this.ormRepository.create({
      customer,
      order_products: ordersProducts,
    });

    await this.ormRepository.save(order);

    return order;
  }

  public async findById(id: string): Promise<Order | undefined> {
    const order = await this.ormRepository.findOne(id);

    return order;
  }
}

export default OrdersRepository;
