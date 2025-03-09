import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';
import * as mongoose from 'mongoose';
import { ANSWER_STATUS } from 'src/utils/enums/index.enum';

export type ResultDocument = Result & Document;

@Schema({ collection: 'results', timestamps: true })
export class Result {
    @Prop({ type: ObjectId })
    id: ObjectId;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'SubPolicy', required: true })
    subPolicyId: mongoose.Schema.Types.ObjectId;  // Foreign Key-like reference

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'employee', required: true })
    employeeId: mongoose.Schema.Types.ObjectId; 

    @Prop({ required: true })
    score: string;

    @Prop({ required: true, default: Date.now })
    submitDate: Date;

    @Prop({ required: true, enum: ANSWER_STATUS })
    resultStatus: string;

    @Prop({ required: true })
    duration: number; // Time save in minutes

    @Prop({ type: String, default : null })
    created_by: string;

    // Updated by field: stores the ID of the user who last updated the document
    @Prop({ type: String , default : null})
    updated_by: string;
}

export const ResultSchema = SchemaFactory.createForClass(Result);

