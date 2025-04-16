import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';
import * as mongoose from 'mongoose';


export type OptionDocument = Option & Document;

@Schema({ collection: 'options', timestamps: true })
export class Option {
    @Prop({ type: ObjectId })
    id: ObjectId;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true })
    questionId: mongoose.Schema.Types.ObjectId;  // Foreign Key-like reference

    @Prop({ required: true, type: Number })
    optionIndex: number;

    @Prop({ required: true })
    optionText: string;
}

export const OptionSchema = SchemaFactory.createForClass(Option);

