import {
    BadRequestException,
    HttpStatus,
    Injectable,
    InternalServerErrorException,
    NotFoundException
} from '@nestjs/common';
import {
    SubPolicy,
    SubPolicyDocument
} from './schema/sub-policy.schema';
import {
    InjectModel
} from '@nestjs/mongoose';
import {
    Model,
    PipelineStage
} from 'mongoose';
import {
    APIResponseInterface
} from 'src/utils/interfaces/response.interface';
import {
    PolicySetting,
    PolicySettingDocument
} from 'src/modules/policy-setting/schema/policy-setting.schema';
import * as mongoose from 'mongoose';

@Injectable()
export class SubPolicyService {
    constructor(
        @InjectModel(PolicySetting.name) private readonly policySettingModel: Model<PolicySettingDocument>,
        @InjectModel(SubPolicy.name) private readonly subPolicyModel: Model<SubPolicyDocument>,
    ) { }

    async getAllSubPolicy(payload: any): Promise<APIResponseInterface<any>> {
        try {

            if (!payload?.policyId) {
                return {
                    code: HttpStatus.BAD_REQUEST,
                    message: 'Policy Id is required',
                };
            }

            const policyId = new mongoose.Types.ObjectId(payload.policyId);

            // Dynamic filter object creation
            const matchQuery: any = {
                policyId: policyId
            };

            if (payload?.isActive !== undefined) {
                matchQuery.isActive = payload?.isActive;
            }

            if (payload.searchText && payload.searchText.trim() !== "") {
                if (!matchQuery.$and) {
                    matchQuery.$and = [];
                }

                matchQuery.$and.push({
                    $or: [{
                        name: {
                            $regex: payload.searchText,
                            $options: 'i'
                        }
                    },
                    {
                        description: {
                            $regex: payload.searchText,
                            $options: 'i'
                        }
                    }
                    ]
                });
            }

            const pipeline: PipelineStage[] = [{
                $match: matchQuery, // Apply filter criteria
            },
            {
                $project: {
                    _id: 1,
                    policyId: 1,
                    name: 1,
                    version: 1,
                    description: 1,
                    createdAt: 1
                },
            },
            {
                $lookup: {
                    from: 'policy_settings', // Reference to policy settings collection
                    localField: '_id', // Field from subPolicy
                    foreignField: 'subPolicyId', // Field from policy_settings
                    as: 'policySettings', // Output array of policySettings
                },
            },
            {
                $lookup: {
                    from: "policy_due_dates",
                    localField: "_id",
                    foreignField: "subPolicyId",
                    pipeline: [
                        {
                            $match: {
                                'employeeId': new mongoose.Types.ObjectId(payload.employeeId)
                            }
                        },
                    ],
                    as: "policyDueDate",
                },
            },
            ];

            /*
            payload.policyType = 1 (For Information), 2 (For Action)
            */

            if (payload.policyType == 2 && payload.userGroup && payload?.isFrontEndRequest === 1) {
                pipeline.push({
                    $lookup: {
                        from: "questions",
                        localField: "_id",
                        foreignField: "subPolicyId",
                        pipeline: [
                            {
                                $match: {
                                    'userGroup': payload.userGroup
                                }
                            }
                        ],
                        as: "questions",
                    },
                },
                    {
                        $unwind: {
                            path: '$questions',
                            preserveNullAndEmptyArrays: false,
                        },
                    });
            }

            // If it's a frontend request, include policy settings with additional filters
            if (payload?.isFrontEndRequest === 1) {
                pipeline.push({
                    $match: {
                        'policySettings.publishDate': {
                            $lt: new Date()
                        }, // Filter by publish date
                        /*'policySettings.examTimeLimit': {
                            $gte: new Date()
                        },*/ // Filter by exam time limit
                    },
                }, {
                    $unwind: '$policySettings',
                });
            } else {
                pipeline.push({
                    $unwind: {
                        path: "$policySettings",
                        preserveNullAndEmptyArrays: true, // Keeps sub-policies even if there's no match
                    },
                })
            }

            if (payload?.sortBy && payload?.sortOrder) {
                const sortOptions: any = {};
                sortOptions[payload.sortBy] = payload.sortOrder === "asc" ? 1 : -1; // Ascending or descending
                pipeline.push({
                    $sort: sortOptions
                });
            } else {
                pipeline.push({
                    $sort: {
                        _id: -1
                    }
                });
            }

            if (payload?.employeeId) {
                pipeline.push(
                    {
                        $lookup: {
                            from: 'accepted_terms_conditions',
                            localField: '_id',
                            foreignField: 'subPolicyId',
                            pipeline: [
                                {
                                    $match: {
                                        'employeeId': new mongoose.Types.ObjectId(payload.employeeId)
                                    }
                                }
                            ],
                            as: 'conditionDetail',
                        },
                    }
                );
            }

            pipeline.push({
                $group: {
                    _id: "$_id",
                    name: { $first: "$name" },
                    version: { $first: "$version" },
                    description: { $first: "$description" },
                    createdAt: { $first: "$createdAt" },
                    policySettings: { $first: "$policySettings" },
                    conditionDetail: { $first: "$conditionDetail" },
                    questions: { $push: "$questions" },
                    policyDueDate: { $first: "$policyDueDate" },
                },
            },
                {
                    $sort: { 'createdAt': -1 }
                }
            );

            const countResult = await this.subPolicyModel.aggregate(pipeline);
            const totalCount = countResult.length;

            // Pagination
            const pageNumber = payload.pageNumber || 1;
            const pageLimit = payload.pageLimit || 10;
            const pageOffset = (pageNumber - 1) * pageLimit; // Calculate the offset

            pipeline.push({
                $skip: pageOffset
            },
                {
                    $limit: pageLimit
                }
            );

            // Execute aggregation pipeline
            const subPolicyList = await this.subPolicyModel.aggregate(pipeline);

            if (subPolicyList.length <= 0) {
                return {
                    code: HttpStatus.OK,
                    message: "Sub Policy list not found."
                }
            }

            return {
                code: HttpStatus.OK,
                message: "Sub policy list.",
                data: {
                    subPolicyList: subPolicyList,
                    count: totalCount,
                    pageNumber: pageNumber,
                    pageLimit: pageLimit
                },
            };

        } catch (error) {
            console.error('Error getAllSubPolicy:', error);
            return {
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
            };
        }
    }

    async createSubPolicy(payload: any): Promise<APIResponseInterface<any>> {
        try {
            // Validate required fields
            if (!payload?.name) {
                return {
                    code: HttpStatus.BAD_REQUEST,
                    message: 'Sub Policy name is required',
                };
            }

            if (!payload?.version) {
                return {
                    code: HttpStatus.BAD_REQUEST,
                    message: 'Sub Policy version is required',
                };
            }

            if (!payload?.policyId) {
                return {
                    code: HttpStatus.BAD_REQUEST,
                    message: 'Policy Id is required',
                };
            }

            // Check if Sub Policy already exists
            const existingDetails = await this.subPolicyModel.findOne({
                policyId: payload?.policyId,
                version: payload?.version,
            }).exec();

            if (existingDetails) {
                return {
                    code: HttpStatus.BAD_REQUEST,
                    message: 'Sub Policy already exists',
                };
            }

            // Create and save new Sub Policy
            const subPolicy = new this.subPolicyModel(payload);
            const data = await subPolicy.save();

            return {
                data
            };
        } catch (error) {
            console.error('Error createSubPolicy:', error);
            return {
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
            };
        }
    }

    async updateSubPolicy(id: string, payload: any): Promise<APIResponseInterface<any>> {
        try {
            if (!id) {
                return {
                    code: HttpStatus.BAD_REQUEST,
                    message: 'Sub Policy ID is required',
                };
            }

            // Validate required fields
            if (!payload?.name) {
                return {
                    code: HttpStatus.BAD_REQUEST,
                    message: 'Sub Policy name is required',
                };
            }

            if (!payload?.version) {
                return {
                    code: HttpStatus.BAD_REQUEST,
                    message: 'Sub Policy version is required',
                };
            }

            if (!payload?.policyId) {
                return {
                    code: HttpStatus.BAD_REQUEST,
                    message: 'Policy Id is required',
                };
            }

            // Check if Sub Policy exists
            const existingSubPolicy = await this.subPolicyModel.findById(id).exec();
            if (!existingSubPolicy) {
                return {
                    code: HttpStatus.NOT_FOUND,
                    message: 'Sub Policy not found',
                };
            }

            // Check if another Sub Policy with same name and version exists
            const duplicateSubPolicy = await this.subPolicyModel.findOne({
                _id: { $ne: id },
                name: payload?.name,
                version: payload?.version,
            }).exec();

            if (duplicateSubPolicy) {
                return {
                    code: HttpStatus.BAD_REQUEST,
                    message: 'Another Sub Policy with the same name and version already exists',
                };
            }

            // Update and save
            Object.assign(existingSubPolicy, payload);
            const updatedSubPolicy = await existingSubPolicy.save();

            return {
                data: updatedSubPolicy,
            };
        } catch (error) {
            console.error('Error updateSubPolicy:', error);
            return {
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
            };
        }
    }

    async deleteById(payload: any): Promise<APIResponseInterface<any>> {
        try {
            // Validate if id is provided
            if (!payload?.id) {
                return {
                    code: HttpStatus.BAD_REQUEST,
                    message: 'Sub Policy Id is required',
                };
            }

            // Attempt to delete Sub Policy by ID
            const result = await this.subPolicyModel.findByIdAndDelete(payload.id).exec();

            if (!result) {
                return {
                    code: HttpStatus.NOT_FOUND,
                    message: `Sub Policy with ID ${payload?.id} not found`,
                };
            }

            return {
                message: `Sub Policy with ID ${payload?.id} deleted successfully`,
            };
        } catch (error) {
            console.error('Error deleteById:', error);
            return {
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
            };
        }
    }

    async findById(payload: any): Promise<APIResponseInterface<SubPolicy>> {
        try {
            // Validate if id is provided
            if (!payload?.id) {
                return {
                    code: HttpStatus.BAD_REQUEST,
                    message: 'Sub Policy Id is required',
                };
            }

            const pipeline = [];

            if (payload?.employeeId) {
                pipeline.push(
                    {
                        $lookup: {
                            from: 'accepted_terms_conditions',
                            localField: '_id',
                            foreignField: 'subPolicyId',
                            pipeline: [
                                {
                                    $match: {
                                        $or: [
                                            { 'employeeId': new mongoose.Types.ObjectId(payload.employeeId) }
                                        ]
                                    }
                                },
                            ],
                            as: 'conditionDetail',
                        },
                    },
                    {
                        $unwind: {
                            path: '$conditionDetail',
                            preserveNullAndEmptyArrays: true, // keep documents even if no match
                        },
                    }
                );
            }

            // Adding the match for sub-policy id to the pipeline
            pipeline.push({
                $match: {
                    _id: new mongoose.Types.ObjectId(payload?.id),
                },
            });

            const subPolicyDetails = await this.subPolicyModel.aggregate(pipeline).exec();


            if (!subPolicyDetails) {
                return {
                    code: HttpStatus.NOT_FOUND,
                    message: 'Sub Policy Not found',
                };
            }

            return {
                data: subPolicyDetails
            };
        } catch (error) {
            console.error('Error findById:', error);
            return {
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
            };
        }
    }
}