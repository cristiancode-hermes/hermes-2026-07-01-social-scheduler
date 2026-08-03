import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

export function databaseConfig(): TypeOrmModuleOptions {
  const dbType = process.env.DATABASE_TYPE || 'sqljs';
  const url = process.env.DATABASE_URL || '';

  if (dbType === 'postgres') {
    return {
      type: 'postgres',
      url,
      entities: [join(__dirname, '..', 'entities', '*.entity.{ts,js}')],
      synchronize: true,
      ssl: { rejectUnauthorized: false },
      logging: process.env.NODE_ENV !== 'production',
    };
  }

  return {
    type: 'sqljs',
    location: join(process.cwd(), 'data', 'social-scheduler.sqlite'),
    autoSave: true,
    entities: [join(__dirname, '..', 'entities', '*.entity.{ts,js}')],
    synchronize: true,
    logging: process.env.NODE_ENV !== 'production',
  };
}
