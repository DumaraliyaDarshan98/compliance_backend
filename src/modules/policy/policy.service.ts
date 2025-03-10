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

@Injectable()
export class PolicyService {
    constructor(
        @InjectModel(Policy.name) private readonly policyModel: Model<PolicyDocument>,
    ) { }

    async getAllPolicy(payload): Promise<APIResponseInterface<any>> {
        try {
            // Create a dynamic matchQuery object
            const matchQuery: Record<string, any> = {};

            // If isActive is provided (true or false), add it to the matchQuery
            if (payload?.isActive !== undefined) {
                matchQuery.isActive = payload?.isActive;
            }

            const pipeline: PipelineStage[] = [{
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
                    as: 'subPolicyDetail',
                },
            },
            {
                $addFields: {
                    subPolicyDetail: {
                        $sortArray: { input: '$subPolicyDetail', sortBy: { createdAt: -1 } },
                    },
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
                    subPolicyDetail: { $first: '$subPolicyDetail' }, // Reassemble the subPolicyDetail array
                },
            },
            ];

            const policyList = await this.policyModel.aggregate(pipeline);

            return {
                data: policyList
            }
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