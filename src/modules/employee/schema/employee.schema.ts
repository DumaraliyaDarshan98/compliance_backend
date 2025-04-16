import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';
import { Gender, ROLES } from 'src/utils/enums/index.enum';

export type EmployeeDocument = Employee & Document;

@Schema({ collection: 'employees', timestamps: true })
export class Employee {
    @Prop({ type: ObjectId })
    id: ObjectId;

    @Prop({ required: true })
    firstName: string;

    @Prop()
    middleName?: string;

    @Prop({ required: true })
    lastName: string;

    @Prop({ required: true, default: 'Male' })
    gender: string;

    @Prop({ required: false, type: Date })
    birthDate: Date;

    @Prop({ required: true, unique: true })
    email: string;

    @Prop({ required: true, type: Date })
    dateOfJoining: Date;

    @Prop()
    phone: string;

    @Prop()
    alternatePhone?: string;

    @Prop()
    country: string;

    @Prop()
    state: string;

    @Prop()
    city: string;

    @Prop({ required: true, enum: ROLES })
    role: ROLES;

    @Prop()
    password?: string;

    @Prop()
    resetPasswordToken?: string;

    @Prop()
    resetPasswordExpires?: Date;

    @Prop()
    profileImg?: string;

    @Prop({ required: true, type: Number, enum: [0, 1], default: 1 })
    isActive: 0 | 1;

    @Prop({ required: true, type: Number, enum: [0, 1], default: 1 })
    isSendMail: 0 | 1;

    @Prop()
    inactiveReason?: string;

    @Prop()
    inactiveDate?: Date;
}

export const EmployeeSchema = SchemaFactory.createForClass(Employee);

