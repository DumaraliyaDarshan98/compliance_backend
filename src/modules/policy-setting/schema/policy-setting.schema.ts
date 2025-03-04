import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';
import { POLICY_TYPE } from 'src/utils/enums/index.enum';

export type PolicySettingDocument = PolicySetting & Document;

@Schema({ collection: 'policy_settings', timestamps: true })
export class PolicySetting {
    @Prop({ type: ObjectId })
    id: ObjectId;

    @Prop({ type: ObjectId })
    policyId: ObjectId;

    @Prop({ required: true, type: Date })
    examTimeLimit: Date; // Representing the exact date and time the exam ends

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

