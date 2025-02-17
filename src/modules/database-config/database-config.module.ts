import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CONFIG } from 'src/utils/config/keys';
import { EmployeeEntity } from './entity/employee.entity';

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: 'mongodb',
            url: CONFIG.databaseUrl,
            database: 'test',
            entities: [EmployeeEntity],
            synchronize: true,
        }),
    ],
})
export class DatabaseConfigModule { }
