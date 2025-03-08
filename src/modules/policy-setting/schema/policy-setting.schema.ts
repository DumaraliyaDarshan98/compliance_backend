import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';
import { POLICY_TYPE } from 'src/utils/enums/index.enum';
import * as mongoose from 'mongoose';

export type PolicySettingDocument = PolicySetting & Document;

@Schema({ collection: 'policy_settings', timestamps: true })
export class PolicySetting {
    @Prop({ type: ObjectId })
    id: ObjectId;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'SubPolicy', required: true })
    subPolicyId: mongoose.Schema.Types.ObjectId; 

    @Prop({ required: true, type: Date })
    publishDate: Date;

    @Prop({ required: true, type: Number, enum: [0, 1], default: 1 })
    skipWeekDays: 0 | 1;

    @Prop({ required: true, type: Date })
    examTimeLimit: Date;

    @Prop({ required: true, type: Number })
    maximumRettemptDaysLeft: number;

    @Prop({ required: true, type: Number })
    maximumAttempt: number;

    @Prop({ required: true, type: Number })
    maximumMarks: number;

    @Prop({ required: true, type: Number })
    maximumScore: number;

    @Prop({ required: true, type: Number })
    maximumQuestions: number;

    @Prop({ required: true, type: Number })
    timeLimit: number; // Time limit in minutes
}

export const PolicySettingSchema = SchemaFactory.createForClass(PolicySetting);

