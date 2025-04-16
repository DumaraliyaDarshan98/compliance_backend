import {
    BadRequestException,
    HttpStatus,
    Injectable,
    InternalServerErrorException,
    NotFoundException
} from "@nestjs/common";
import {
    Policy,
    PolicyDocument
} from "./schema/policy.schema";
import {
    InjectModel
} from "@nestjs/mongoose";
import {
    Model,
    PipelineStage
} from "mongoose";
import {
    APIResponseInterface
} from "src/utils/interfaces/response.interface";
import * as mongoose from 'mongoose';

@Injectable()
export class PolicyService {
    constructor(
        @InjectModel(Policy.name) private readonly policyModel: Model<PolicyDocument>,
    ) { }

    async getAllPolicy(payload): Promise<APIResponseInterface<any>> {
        try {
            let matchQuery: any = {};

            if (payload?.isActive !== undefined) {
                matchQuery.isActive = payload?.isActive;
            }

            if (payload.searchText && payload.searchText.trim() !== "") {
                if (!matchQuery.$and) {
                    matchQuery.$and = [];
                }

                matchQuery.$and.push({
                    $or: [
                        { name: { $regex: payload.searchText, $options: 'i' } },
                        { description: { $regex: payload.searchText, $options: 'i' } }]
                });
            }

            let sortOptions = {};
            if (payload.sortBy && payload.sortOrder) {
                sortOptions[payload.sortBy] = payload.sortOrder === "asc" ? 1 : -1;
            } else {
                sortOptions['_id'] = -1;
            }

            var pageNumber = payload.pageNumber || 1;
            var pageLimit = payload.pageLimit || 10;
            const pageOffset = (pageNumber - 1) * pageLimit;

            const countPipeline = [
                {
                    $match: matchQuery, // Apply filter criteria
                },
                {
                    $count: 'totalCount', // Count the number of matching documents
                }
            ];

            // Get the count of the total records
            const countResult = await this.policyModel.aggregate(countPipeline);
            const totalCount = countResult.length > 0 ? countResult[0].totalCount : 0;


            const pipeline: PipelineStage[] = [
                {
                    $match: matchQuery, // Apply filter criteria
                },
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        version: 1,
                        description: 1,
                        createdAt: 1,
                        policyType: 1,
                        status: 1
                    },
                },
                {
                    $lookup: {
                        from: 'sub_policies',
                        localField: '_id',
                        foreignField: 'policyId',
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $and: [ { $eq: [ "$isActive", 1 ] } ] }
                                }
                            },
                            {
                                $lookup: {
                                    from: 'accepted_terms_conditions', 
                                    localField: '_id', 
                                    foreignField: 'subPolicyId', 
                                    pipeline: [
                                        {
                                            $match: {
                                                "employeeId": new mongoose.Types.ObjectId(payload.employeeId), // Filter by employeeId
                                            }
                                        },],
                                    as: 'conditionDetail',
                                },
                            },
                            {
                                $sort: { 'createdAt' : 1},
                            }
                        ],
                        as: 'subPolicyDetail',
                    },
                },
                {
                    $group: {
                        _id: '$_id',
                        name: { $first: '$name' },
                        version: { $first: '$version' },
                        description: { $first: '$description' },
                        createdAt: { $first: '$createdAt' },
                        policyType: { $first: '$policyType' },
                        status: { $first: '$status' },
                        subPolicyDetail: { $push: '$subPolicyDetail' }, // Reassemble the subPolicyDetail array
                    },
                },
                {
                    $sort: sortOptions,
                },
                {
                    $skip: pageOffset,
                },
                {
                    $limit: pageLimit,
                }
            ];
             
            const policyList = await this.policyModel.aggregate(pipeline);

            if (policyList.length <= 0) {
                return {
                    code: HttpStatus.OK,
                    message: "Policy list not found."
                }
            }

            return {
                code: HttpStatus.OK,
                message: "Policy list.",
                data: {
                    policyList: policyList,
                    count: totalCount,
                    pageNumber: pageNumber,
                    pageLimit: pageLimit
                },
            };
        } catch (error) {
            console.error("Error getAllPolicy:", error);
            throw new InternalServerErrorException("Failed to get list policy");
        }
    }

    async createPolicy(payload: any): Promise<APIResponseInterface<any>> {
        try {
            if (!payload?.name) {
                return {
                    code: HttpStatus.BAD_REQUEST,
                    message: "Policy name is required",
                }
            }

            if (!payload?.version) {
                return {
                    code: HttpStatus.BAD_REQUEST,
                    message: "Policy version is required",
                }
            }

            if (!payload?.userGroup) {
                return {
                    code: HttpStatus.BAD_REQUEST,
                    message: "Policy user group is required",
                }
            }

            if (!payload?.policyType) {
                return {
                    code: HttpStatus.BAD_REQUEST,
                    message: "Policy policy type is required",
                }
            }

            const existingDetails = await this.policyModel.findOne({
                name: payload?.name,
                version: payload?.version
            }).exec();

            if (existingDetails) {
                return {
                    code: HttpStatus.BAD_REQUEST,
                    message: "Policy already exists",
                }
            }

            payload['status'] = "Pending";

            const policy = new this.policyModel(payload);

            const data = await policy.save();

            return {
                data
            };
        } catch (error) {
            console.error("Error createPolicy:", error);
            throw new InternalServerErrorException("Failed to create policy");
        }
    }

    async updatePolicy(id: string, payload: any): Promise<APIResponseInterface<any>> {
        try {
            if (!id) {
                return {
                    code: HttpStatus.BAD_REQUEST,
                    message: "Policy ID is required",
                };
            }

            if (!payload?.name) {
                return {
                    code: HttpStatus.BAD_REQUEST,
                    message: "Policy name is required",
                };
            }

            if (!payload?.version) {
                return {
                    code: HttpStatus.BAD_REQUEST,
                    message: "Policy version is required",
                };
            }

            if (!payload?.userGroup) {
                return {
                    code: HttpStatus.BAD_REQUEST,
                    message: "Policy user group is required",
                };
            }

            if (!payload?.policyType) {
                return {
                    code: HttpStatus.BAD_REQUEST,
                    message: "Policy policy type is required",
                };
            }

            // Check if policy exists
            const existingPolicy = await this.policyModel.findById(id).exec();
            if (!existingPolicy) {
                return {
                    code: HttpStatus.NOT_FOUND,
                    message: "Policy not found",
                };
            }

            // Check for uniqueness: same name and version in another policy
            const duplicatePolicy = await this.policyModel.findOne({
                _id: { $ne: id }, // Exclude current policy
                name: payload?.name,
                version: payload?.version,
            }).exec();

            if (duplicatePolicy) {
                return {
                    code: HttpStatus.BAD_REQUEST,
                    message: "Another policy with the same name and version already exists",
                };
            }

            // Update fields
            Object.assign(existingPolicy, payload);

            const updatedPolicy = await existingPolicy.save();

            return {
                data: updatedPolicy,
            };
        } catch (error) {
            console.error("Error updatePolicy:", error);
            throw new InternalServerErrorException("Failed to update policy");
        }
    }


    async deleteById(id: string): Promise<APIResponseInterface<any>> {
        try {
            const result = await this.policyModel.findByIdAndDelete(id).exec();
            if (!result) {
                throw new NotFoundException(`Policy with ID ${id} not found`);
            }
            return {
                message: `Policy with ID ${id} deleted successfully`
            };
        } catch (error) {
            console.error("Error deleteById:", error);
            throw new InternalServerErrorException("Failed to deleteById");
        }
    }

    async findById(id: string): Promise<APIResponseInterface<Policy>> {
        try {
            const policyDetails = await this.policyModel.findById(id).exec();
            if (!policyDetails) {
                throw new NotFoundException(`Policy with ID ${id} not found`);
            }
            return {
                data: policyDetails
            };
        } catch (error) {
            console.error("Error findById:", error);
            throw new InternalServerErrorException("Failed to findById");
        }
    }
}