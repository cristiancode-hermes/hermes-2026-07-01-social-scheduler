import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

export function databaseConfig(): TypeOrmModuleOptions {
  return {
    type: 'sqljs',
    location: join(process.cwd(), 'data', 'social-scheduler.sqlite'),
    autoSave: true,
    entities: [join(__dirname, '..', 'entities', '*.entity.{ts,js}')],
    synchronize: true,
    logging: process.env.NODE_ENV !== 'production',
  };
}
