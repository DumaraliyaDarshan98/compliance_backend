import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';
import { POLICY_TYPE } from 'src/utils/enums/index.enum';

export type PolicyDocument = Policy & Document;

@Schema({ collection: 'policies', timestamps: true })
export class Policy {
    @Prop({ type: ObjectId })
    id: ObjectId;

    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    version: string;

    @Prop({ required: true })
    description: string;
    
    @Prop({ required: true }) // Multiple like EMPLOYEE, LINE MANAGER
    userGroup: string;

    @Prop({ required: true, enum: POLICY_TYPE }) // enum
    policyType: POLICY_TYPE;

    @Prop({ required: true })
    status: string;

    @Prop({ required: true, type: Number, enum: [0, 1], default: 1 })
    isActive: 0 | 1;
}

export const PolicySchema = SchemaFactory.createForClass(Policy);

