import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';
import { POLICY_TYPE } from 'src/utils/enums/index.enum';
import * as mongoose from 'mongoose';

export type SubPolicyDocument = SubPolicy & Document;

@Schema({ collection: 'sub_policies', timestamps: true })
export class SubPolicy {
    @Prop({ type: ObjectId })
    id: ObjectId;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Policy', required: true })
    policyId: mongoose.Schema.Types.ObjectId; 

    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    version: string;

    @Prop({ required: true })
    description: string;

    @Prop({ required: true, type: Number, enum: [0, 1], default: 1 })
    isActive: 0 | 1;
}

export const SubPolicySchema = SchemaFactory.createForClass(SubPolicy);

