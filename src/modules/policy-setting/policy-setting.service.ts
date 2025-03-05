import { BadRequestException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { PolicySetting, PolicySettingDocument } from "./schema/policy-setting.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { APIResponseInterface } from "src/utils/interfaces/response.interface";
import { Policy, PolicyDocument } from 'src/modules/policy/schema/policy.schema';

@Injectable()
export class PolicySettingService {
    constructor(
        @InjectModel(Policy.name) private readonly policyModel: Model<PolicyDocument>,
        @InjectModel(PolicySetting.name) private readonly policySettingModel: Model<PolicySettingDocument>, // Injecting the Mongoose model
    ) {}

    async upsertPolicySetting(payload: any): Promise<APIResponseInterface<any>> {
        try {
            // Validate required fields
            const requiredFields = [
                { field: "policyId", message: "Policy Id is required" },
            ];

            for (const { field, message } of requiredFields) {
                if (!payload?.[field]) {
                    return {
                        code: HttpStatus.BAD_REQUEST,
                        message,
                    };
                }
            }

            // Check if the policy exists
            const policyId = new Types.ObjectId(payload.policyId);
            const policyExists = await this.policyModel.findById(policyId).exec();

            if (!policyExists) {
                return {
                    code: HttpStatus.NOT_FOUND,
                    message: 'Policy not found',
                };
            }

            // Check if a policy setting already exists for the given policyId
            const existingPolicy = await this.policySettingModel.findOne({ policyId: policyId }).exec();

            let savedPolicySetting;

            if (existingPolicy) {
                // Update existing policy settings
                existingPolicy.examTimeLimit = payload.examTimeLimit || existingPolicy.examTimeLimit;
                existingPolicy.maximumRettemptDaysLeft = payload.maximumRettemptDaysLeft || existingPolicy.maximumRettemptDaysLeft;
                existingPolicy.maximumAttempt = payload.maximumAttempt || existingPolicy.maximumAttempt;
                existingPolicy.maximumMarks = payload.maximumMarks || existingPolicy.maximumMarks;
                existingPolicy.maximumScore = payload.maximumScore || existingPolicy.maximumScore;
                existingPolicy.maximumQuestions = payload.maximumQuestions || existingPolicy.maximumQuestions;
                existingPolicy.timeLimit = payload.timeLimit || existingPolicy.timeLimit;

                savedPolicySetting = await existingPolicy.save();
            } else {

                // Validate required fields
                const requiredFields = [
                    { field: "examTimeLimit", message: "Exam Time Limit is required" },
                    { field: "maximumRettemptDaysLeft", message: "Max Re-Attempt days left is required" },
                    { field: "maximumAttempt", message: "Max Attempt is required" },
                    { field: "maximumMarks", message: "Max Marks is required" },
                    { field: "maximumScore", message: "Max Score is required" },
                    { field: "maximumQuestions", message: "Max Questions is required" },
                    { field: "timeLimit", message: "Time limit is required" },
                ];

                for (const { field, message } of requiredFields) {
                    if (!payload?.[field]) {
                        return {
                            code: HttpStatus.BAD_REQUEST,
                            message,
                        };
                    }
                }

                // Create a new policy setting
                const newPolicySetting = new this.policySettingModel(payload);
                savedPolicySetting = await newPolicySetting.save();
            }

            return {
                code: HttpStatus.CREATED,
                message: "Policy Setting saved successfully",
                data: savedPolicySetting,
            };
        } catch (error) {
            console.error("Error upsertPolicySetting:", error);
            return {
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
            };
        }
    }

    async findByPolicyId(payload: any): Promise<APIResponseInterface<PolicySetting>> {
        try {
            // Validate if the policyId exists in the payload
            if (!payload?.policyId) {
                return {
                    code: HttpStatus.BAD_REQUEST,
                    message: "Policy Id is required",
                };
            }

            // Check if the policy exists
            const policyExists = await this.policyModel.findById(payload?.policyId).exec();

            if (!policyExists) {
                return {
                    code: HttpStatus.NOT_FOUND,
                    message: 'Policy not found',
                };
            }

            // Find the policy setting by policyId
            const policySettingDetail = await this.policySettingModel.findOne({ policyId: payload?.policyId }).exec();
            
            if (!policySettingDetail) {
                return {
                    code: HttpStatus.NOT_FOUND,
                    message: "Policy Setting not found",
                };
            }

            return {
                code: HttpStatus.OK,
                message: "Policy Setting found",
                data: policySettingDetail,
            };
        } catch (error) {
            console.error("Error findByPolicyId:", error);
            return {
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
            };
        }
    }
}
