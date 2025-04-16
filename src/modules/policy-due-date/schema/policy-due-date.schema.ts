import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';
import * as mongoose from 'mongoose';

export type PolicyDueDateDocument = PolicyDueDate & Document;

@Schema({ collection: 'policy_due_dates', timestamps: true })
export class PolicyDueDate {
    @Prop({ type: ObjectId })
    id: ObjectId;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'SubPolicy', required: true })
    subPolicyId: mongoose.Schema.Types.ObjectId; 

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true })
    employeeId: mongoose.Schema.Types.ObjectId; 

    @Prop({ required: true, type: Date })
    dueDate: Date;

}

export const PolicyDueDateSchema = SchemaFactory.createForClass(PolicyDueDate);

