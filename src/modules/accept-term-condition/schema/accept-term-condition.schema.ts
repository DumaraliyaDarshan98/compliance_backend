import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';
import * as mongoose from 'mongoose';

export type AcceptTermConditionDocument = AcceptTermCondition & Document;

@Schema({ collection: 'accepted_terms_conditions', timestamps: true })
export class AcceptTermCondition {
    @Prop({ type: ObjectId })
    id: ObjectId;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'SubPolicy', required: true })
    subPolicyId: mongoose.Schema.Types.ObjectId;  // Foreign Key-like reference

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'employee', required: true })
    employeeId: mongoose.Schema.Types.ObjectId; 

    @Prop({ required: true })
    ipAddress: string;

    @Prop({ required: true })
    location: string;

    @Prop({ type: String, default : null })
    createdBy: string;

    // Updated by field: stores the ID of the user who last updated the document
    @Prop({ type: String , default : null})
    updatedBy: string;
}

export const AcceptTermConditionSchema = SchemaFactory.createForClass(AcceptTermCondition);

