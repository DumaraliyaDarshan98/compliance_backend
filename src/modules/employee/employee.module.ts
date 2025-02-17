import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeEntity } from '../database-config/entity/employee.entity';
import { EmployeeService } from './employee.service';
import { EmployeeController } from './employee.controller';

@Module({
    imports: [TypeOrmModule.forFeature([EmployeeEntity])],
    providers: [EmployeeService],
    controllers: [EmployeeController],
})
export class EmployeeModule { }
