import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';
import { QUESTION_TYPE, USER_GROUP } from 'src/utils/enums/index.enum';
import * as mongoose from 'mongoose';

export type QuestionDocument = Question & Document;

@Schema({ collection: 'questions', timestamps: true })
export class Question {
    @Prop({ type: ObjectId })
    id: ObjectId;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'SubPolicy', required: true })
    subPolicyId: mongoose.Schema.Types.ObjectId;  // Foreign Key-like reference

    @Prop({ required: true, enum: USER_GROUP })
    userGroup: string;

    @Prop({ required: true })
    questionText: string;

    @Prop({ required: true, enum: QUESTION_TYPE })
    questionType: string;

    @Prop({ required: true })
    answer: string;

    @Prop({ required: true, type: Number, enum: [0, 1], default: 1 })
    isActive: 0 | 1;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);

