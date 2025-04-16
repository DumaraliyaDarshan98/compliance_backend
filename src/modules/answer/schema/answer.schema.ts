import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';
import * as mongoose from 'mongoose';

export type AnswerDocument = Answer & Document;

@Schema({ collection: 'answers', timestamps: true })
export class Answer {
    @Prop({ type: ObjectId })
    id: ObjectId;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'sub_policys', required: true })
    subPolicyId: mongoose.Schema.Types.ObjectId;  // Foreign Key-like reference

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'questions', required: true })
    questionId: mongoose.Schema.Types.ObjectId;  // Foreign Key-like reference

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'employees', required: true })
    employeeId: mongoose.Schema.Types.ObjectId;  // Foreign Key-like reference

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'results', required: true })
    resultId: mongoose.Schema.Types.ObjectId;  // Foreign Key-like reference

    @Prop({ required: true })
    answer: string;

    @Prop({ type: String, default : null })
    created_by: string;

    // Updated by field: stores the ID of the user who last updated the document
    @Prop({ type: String , default : null})
    updated_by: string;

}

export const AnswerSchema = SchemaFactory.createForClass(Answer);

