import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';
import { Gender, Roles } from 'src/utils/enums/index.enum';
import * as bcrypt from 'bcrypt';

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

    @Prop({ required: true, enum: Gender })
    gender: Gender;

    @Prop({ required: true, type: Date })
    birthDate: Date;

    @Prop({ required: true, unique: true })
    email: string;

    @Prop({ required: true, type: Date })
    dateOfJoining: Date;

    @Prop({ required: true })
    phone: string;

    @Prop()
    alternatePhone?: string;

    @Prop({ required: true })
    country: string;

    @Prop({ required: true })
    state: string;

    @Prop({ required: true })
    city: string;

    @Prop({ required: true, enum: Roles })
    role: Roles;

    @Prop({ required: true })
    password: string;
}

export const EmployeeSchema = SchemaFactory.createForClass(Employee);

// Middleware to hash password before saving
EmployeeSchema.pre<EmployeeDocument>('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

