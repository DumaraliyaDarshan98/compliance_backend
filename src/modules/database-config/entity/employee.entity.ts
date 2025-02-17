import { Gender, Roles } from '../../../utils/enums/index.enum';
import { Column, CreateDateColumn, Entity, ObjectIdColumn, UpdateDateColumn } from 'typeorm';
import { ObjectId } from 'mongodb';

@Entity('employees_test')
export class EmployeeEntity {
    @ObjectIdColumn()
    id: ObjectId;

    @Column()
    firstName: string;

    @Column()
    middleName: string;

    @Column()
    lastName: string;

    @Column({ enum: Gender })
    gender: Gender;

    @Column()
    birthDate: Date;

    @Column({ nullable: false })
    email: string;

    @Column()
    dateOfJoining: Date;

    @Column()
    phone: string;

    @Column()
    alternatePhone?: string;

    @Column()
    country: string;

    @Column()
    state: string;

    @Column()
    city: string;

    @Column({ enum: Roles, nullable: false })
    role: Roles;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date
}