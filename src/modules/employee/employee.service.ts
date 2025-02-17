import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository} from 'typeorm';
import { ObjectId } from 'mongodb';
import { EmployeeEntity } from '../database-config/entity/employee.entity';

@Injectable()
export class EmployeeService {
    constructor(
        @InjectRepository(EmployeeEntity)
        private readonly userRepository: Repository<EmployeeEntity>,
    ) { }

    async create(userData: any): Promise<any> {
        const user = this.userRepository.create(userData);
        return await this.userRepository.save(user);
    }

    async findAll(): Promise<any[]> {
        return await this.userRepository.find();
    }

    async findOne(id: any): Promise<any> {
        const user = await this.userRepository.findOne({ where : { email: "test@gmail.com" } });

        // const objectId = id instanceof ObjectId ? id : new ObjectId(id);

        console.log("67b3700c40b8a8e656071efa", user)
        console.log("ID Type:", typeof id, "Value:", id);
        return await this.userRepository.findOneBy({ id: new ObjectId(id)  });
    }
}
