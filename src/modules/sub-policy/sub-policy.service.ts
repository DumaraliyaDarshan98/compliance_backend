import { BadRequestException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { SubPolicy, SubPolicyDocument } from "./schema/sub-policy.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { APIResponseInterface } from "src/utils/interfaces/response.interface";

@Injectable()
export class SubPolicyService {
    constructor(
        @InjectModel(SubPolicy.name) private readonly subPolicyModel: Model<SubPolicyDocument>,
    ) { }

    async getAllSubPolicy(payload: any): Promise<APIResponseInterface<any>> {
        try {
            if (!payload?.policyId) {
                return {
                    code: HttpStatus.BAD_REQUEST,
                    message: "Policy Id is required",
                }
            }

            const subPolicyList = await this.subPolicyModel.find({ policyId: payload?.policyId }).exec();
            return {
                code: HttpStatus.OK,
                message: 'Sub Policy list',
                data: subPolicyList
            }
        } catch (error) {
            console.error("Error getAllSubPolicy:", error);
            return {
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
            }
        }
    }

    async createSubPolicy(payload: any): Promise<APIResponseInterface<any>> {
        try {
            if (!payload?.name) {
                return {
                    code: HttpStatus.BAD_REQUEST,
                    message: "Sub Policy name is required",
                }
            }

            if (!payload?.version) {
                return {
                    code: HttpStatus.BAD_REQUEST,
                    message: "Sub Policy version is required",
                }
            }

            if (!payload?.policyId) {
                return {
                    code: HttpStatus.BAD_REQUEST,
                    message: "Policy Id is required",
                }
            }

            const existingDetails = await this.subPolicyModel.findOne({ name: payload?.name, version: payload?.version }).exec();

            if (existingDetails) {
                return {
                    code: HttpStatus.BAD_REQUEST,
                    message: "Sub Policy already exists",
                }
            }

            const subPolicy = new this.subPolicyModel(payload);

            const data = await subPolicy.save();

            return { data };
        } catch (error) {
            console.error("Error createPolicy:", error);
            return {
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
            }
        }
    }

    async deleteById(payload: any): Promise<APIResponseInterface<any>> {
        try {
            if (!payload?.id) {
                return {
                    code: HttpStatus.BAD_REQUEST,
                    message: "Sub Policy Id is required",
                }
            }

            const result = await this.subPolicyModel.findByIdAndDelete(payload.id).exec();
            if (!result) {
                return {
                    code: HttpStatus.NOT_FOUND,
                    message: `Sub Policy with ID ${payload?.id} not found`,
                }
            }
            return { message: `Sub Policy with ID ${payload?.id} deleted successfully` };
        } catch (error) {
            console.error("Error deleteById:", error);
            return {
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
            }
        }
    }

    async findById(payload: any): Promise<APIResponseInterface<SubPolicy>> {
        try {
            if (!payload?.id) {
                return {
                    code: HttpStatus.BAD_REQUEST,
                    message: "Sub Policy Id is required",
                }
            }

            const subPolicyDetails = await this.subPolicyModel.findById(payload?.id).exec();
            if (!subPolicyDetails) {
                return {
                    code: HttpStatus.NOT_FOUND,
                    message: "Sub Policy Not found",
                }
            }
            return { data: subPolicyDetails };
        } catch (error) {
            console.error("Error findById:", error);
            return {
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
            }
        }
    }
}