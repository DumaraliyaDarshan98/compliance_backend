import { BadRequestException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { PolicySetting, PolicySettingDocument } from "./schema/policy-setting.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { APIResponseInterface } from "src/utils/interfaces/response.interface";

@Injectable()
export class PolicySettingService {
    constructor(
            @InjectModel(PolicySetting.name) private readonly policySettingModel: Model<PolicySettingDocument>, // Injecting the Mongoose model
            ) { }

    // Method for creating a new policy setting
    async createPolicySetting(payload: any): Promise<APIResponseInterface<any>> {
        try {
            // Validate required fields
            const requiredFields = [
                { field: "policyId", message: "Policy Id is required" },
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

            // Check if a policy with the same policyId already exists
            const existingPolicy = await this.policySettingModel.findOne({ policyId: payload.policyId }).exec();

            if (existingPolicy) {
                return {
                    code: HttpStatus.BAD_REQUEST,
                    message: "Policy with this policyId already exists. Use the update method to modify it.",
                };
            }

            // Create the new policy setting
            const newPolicySetting = new this.policySettingModel(payload);
            const savedPolicySetting = await newPolicySetting.save();

            return {
                code: HttpStatus.CREATED,
                message: "Policy Setting created successfully",
                data: savedPolicySetting,
            };
        } catch (error) {
            console.error("Error createPolicySetting:", error);
            return {
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
            };
        }
    }

    // Method for updating an existing policy setting
    async updatePolicySetting(payload: any): Promise<APIResponseInterface<any>> {
        try {
            // Validate required fields
            if (!payload?.policyId) {
                return {
                    code: HttpStatus.BAD_REQUEST,
                    message: "Policy Id is required",
                };
            }

            // Find the existing policy setting by policyId
            const existingPolicy = await this.policySettingModel.findOne({ policyId: payload.policyId }).exec();

            if (!existingPolicy) {
                return {
                    code: HttpStatus.NOT_FOUND,
                    message: "Policy Setting not found for the given policyId",
                };
            }

            // Update the policy settings with the new data
            const updatedPolicySetting = await this.policySettingModel.findOneAndUpdate(
                { policyId: payload.policyId },
                {
                    ...payload,  // Update all fields with the new payload
                    updatedAt: new Date(),
                },
                { new: true }  // Return the updated document
            ).exec();

            return {
                code: HttpStatus.OK,
                message: "Policy Setting updated successfully",
                data: updatedPolicySetting,
            };
        } catch (error) {
            console.error("Error updatePolicySetting:", error);
            return {
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
            };
        }
    }

    async findByPolicyId(payload: any): Promise<APIResponseInterface<PolicySetting>> {
        try {
            if (!payload?.policyId) {
                return {
                    code: HttpStatus.BAD_REQUEST,
                    message: "Policy Id is required",
                }
            }

            const policySettingDetail = await this.policySettingModel.findOne({policyId : payload?.policyId}).exec();
            if (!policySettingDetail) {
                return {
                    code: HttpStatus.NOT_FOUND,
                    message: "Policy Setting Not found",
                }
            }
            return { data: policySettingDetail };
        } catch (error) {
            console.error("Error findByPolicyId:", error);
            return {
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
            }
        }
    }
}